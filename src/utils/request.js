import { ethers } from "ethers";
import { Buffer } from 'buffer';

const sha3 = require('js-sha3').keccak_256;

// @ts-ignore
window.Buffer = Buffer;

const FileContractInfo = {
  abi: [
    "function writeChunk(bytes memory name, bytes memory fileType, uint256 chunkId, bytes calldata data) public payable",
    "function remove(bytes memory name) external returns (uint256)",
    "function removes(bytes[] memory names) public",
    "function countChunks(bytes memory name) external view returns (uint256)",
    "function getChunkHash(bytes memory name, uint256 chunkId) public view returns (bytes32)",
    "function getAuthorFiles(address author) public view returns (uint256[] memory times,bytes[] memory names,bytes[] memory types,string[] memory urls)"
  ],
};

const stringToHex = (s) => ethers.hexlify(ethers.toUtf8Bytes(s));

export const FileContract = async (address) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(address, FileContractInfo.abi, provider);
  return contract.connect(await provider.getSigner());
};

const bufferChunk = (buffer, chunkSize) => {
  let i = 0;
  let result = [];
  const len = buffer.length;
  const chunkLength = Math.ceil(len / chunkSize);
  while (i < len) {
    result.push(buffer.slice(i, i += chunkLength));
  }
  return result;
}

const clearOldFile = async (fileContract, chunkSize, hexName) => {
  try {
    const oldChunkSize = await fileContract.countChunks(hexName);
    if (oldChunkSize > chunkSize) {
      // remove
      const tx = await fileContract.remove(hexName);
      console.log(`Remove file: ${hexName}`);
      console.log(`Transaction Id: ${tx.hash}`);
      const receipt = await tx.wait();
      return receipt.status;
    }
  } catch (e) {
    return false;
  }
  return true;
}

export const request = async ({
  chunkLength,
  account,
  contractAddress,
  flatDirectoryAddress,
  dirPath,
  file,
  onSuccess,
  onError,
  onProgress
}) => {
  const rawFile = file.raw;
  let content = await rawFile.arrayBuffer();
  content = Buffer.from(content);

  // file name
  const name = dirPath + rawFile.name;
  const hexName = stringToHex(name);
  const hexType = stringToHex(rawFile.type);
  let fileSize = rawFile.size;
  let chunks = [];
  if (fileSize > chunkLength) {
    const chunkSize = Math.ceil(fileSize / chunkLength);
    chunks = bufferChunk(content, chunkSize);
  } else {
    chunks.push(content);
  }

  const fileContract = await FileContract(contractAddress);
  const clear = await clearOldFile(fileContract, chunks.length, hexName, hexType)
  if (!clear) {
    onError(new Error("Check Old File Fail!"));
    return;
  }

  let uploadState = true;
  for (const index in chunks) {
    const chunk = chunks[index];
    const hexData = '0x' + chunk.toString('hex');
    const localHash = '0x' + sha3(chunk);
    const hash = await fileContract.getChunkHash(hexName, index);
    if (localHash === hash) {
      console.log(`File ${name} chunkId: ${index}: The data is not changed.`);
      onProgress({ percent: Number(index) + 1});
      continue;
    }

    try {
      // file is remove or change
      const tx = await fileContract.writeChunk(hexName, hexType, index, hexData);
      console.log(`Transaction Id: ${tx.hash}`);
      const receipt = await tx.wait();
      if (!receipt.status) {
        uploadState = false;
        break;
      }
      onProgress({ percent: Number(index) + 1});
    } catch (e) {
      console.log(e);
      uploadState = false;
      break;
    }
  }
  if (uploadState) {
    // https://0xf208000076869ca535575baddd9152ac0a05986c.3333.w3link.io/0x1111.../app.html
    const url = "https://" + flatDirectoryAddress + '.3337.w3link.io/' + account + "/" + name;
    onSuccess({ path: url});
  } else {
    onError(new Error('upload request failed!'));
  }
};
