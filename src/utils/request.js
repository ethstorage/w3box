import { ethers } from "ethers";
import {FileContractSession} from "@/utils/contract";
import {EncodeBlobs, GenerateBlobs, getBlobHash, Send4844Tx} from "@/utils/send-4844-tx";
import {getSessionKey, queryBalance} from "@/utils/Session";

const MAX_BLOB_COUNT = 3;
const ENCODE_BLOB_SIZE = 31 * 4096;
const JSON_RPC = "https://rpc.dencun-devnet-12.ethpandaops.io";

const stringToHex = (s) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));

const readFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (res) => {
      resolve(Buffer.from(res.target.result));
    };
    reader.readAsArrayBuffer(file);
  });
}

const clearOldFile = async (fileContract, account, chunkSize, hexName) => {
  try {
    const oldChunkSize = await fileContract.countChunks(account, hexName);
    if (oldChunkSize > chunkSize) {
      // remove
      const tx = await fileContract.remove(account, hexName);
      const receipt = await tx.wait();
      return receipt.status;
    }
  } catch (e) {
    return false;
  }
  return true;
}

export const request = async ({
  account,
  contractAddress,
  fdContract,
  dirPath,
  file,
  onSuccess,
  onError,
  onProgress
}) => {
  const rawFile = file.raw;
  const content = await readFile(rawFile);
  // file name
  const name = dirPath + rawFile.name;
  const hexName = stringToHex(name);
  const hexType = stringToHex(rawFile.type);
  const fileSize = rawFile.size;

  // Data to blob
  const blobs = EncodeBlobs(content);

  let pk = getSessionKey(account);
  pk = '0x' + Buffer.from(pk, 'base64').toString('hex');
  const sessionAddr = new ethers.Wallet(pk).address;
  const send4844Tx = new Send4844Tx(JSON_RPC, pk);
  const fileContract = await FileContractSession(contractAddress, pk);
  const clear = await clearOldFile(fileContract, account, blobs.length, hexName)
  if (!clear) {
    onError(new Error("Check Old File Fail!"));
    return;
  }

  const cost = await fileContract.upfrontPayment();

  let uploadState = true;
  let notEnoughBalance = false;
  const blobLength = blobs.length;
  for (let i = 0; i < blobLength; i += MAX_BLOB_COUNT) {
    // split, pack
    const blobArr = [];
    const hexBlobArr = [];
    const indexArr = [];
    const lenArr = [];
    let max = i + MAX_BLOB_COUNT;
    if (max > blobLength) {
      max = blobLength;
    }
    for (let j = i; j < max; j++) {
      blobArr.push(blobs[j]);
      hexBlobArr.push(ethers.utils.hexlify(blobs[j]))
      indexArr.push(j);
      if (j === blobLength - 1) {
        lenArr.push(fileSize - ENCODE_BLOB_SIZE * (blobLength - 1));
      } else {
        lenArr.push(ENCODE_BLOB_SIZE);
      }
    }

    // get blob info
    const result = await GenerateBlobs(hexBlobArr);
    if (!result) {
      // generate blob fail
      uploadState = false;
      break;
    }

    // check change
    const {versionedHashes, commitments, proofs} = result;
    let hasChange = false;
    for (let j = 0; j < blobArr.length; j++) {
      const dataHash = await fileContract.getChunkHash(account, hexName, indexArr[j]);
      const localHash = getBlobHash(versionedHashes[j]);
      if (dataHash !== localHash) {
        hasChange = true;
        break;
      }
    }
    if (!hasChange) {
      for (let j = 0; j < blobArr.length; j++) {
        onProgress({percent: Number(indexArr[j]) + 1});

      }
      console.log(`File ${name} chunkId: ${indexArr}: The data is not changed.`);
      continue;
    }

    let balance = await queryBalance(sessionAddr);
    balance = ethers.utils.parseEther(balance);
    const value = cost.mul(blobArr.length);
    if (balance.lt(value)) {
      // gas not enough
      uploadState = false;
      notEnoughBalance = true;
      break;
    }

    try {
      // file is remove or change
      const tx = await fileContract.populateTransaction.writeChunk(account, hexName, hexType, indexArr, lenArr, {
        value: value,
      });
      const hash = send4844Tx.sendTx(blobArr, proofs, commitments, versionedHashes, tx);
      console.log(`Transaction Id: ${hash}`);
      const receipt = await send4844Tx.getTxReceipt(hash);
      if (!receipt.status) {
        uploadState = false;
        break;
      }

      for (let j = 0; j < blobArr.length; j++) {
        onProgress({percent: Number(indexArr[j]) + 1});
      }
    } catch (e) {
      console.log(e)
      uploadState = false;
      break;
    }
  }

  if (uploadState) {
    const url = "https://" +  fdContract + ".333.w3link.io/" + account + "/" + name;
    onSuccess({ path: url});
  } else {
    if (notEnoughBalance) {
      onError(new NotEnoughBalance('Not enough balance'));
    } else {
      onError(new Error('upload request failed!'));
    }
  }
};

export class NotEnoughBalance extends Error {}
