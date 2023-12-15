import {ethers} from "ethers";
import {BlobEIP4844Transaction} from "@ethereumjs/tx";
import {Common} from "@ethereumjs/common";
import defaultAxios from "axios";

const axios = defaultAxios.create({
    timeout: 30000,
});

const BlobTxBytesPerFieldElement         = 32;      // Size in bytes of a field element
const BlobTxFieldElementsPerBlob         = 4096;
const BLOB_SIZE = BlobTxBytesPerFieldElement * BlobTxFieldElementsPerBlob
const API_URL = "https://api.w3link.io:3001/generate";

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function _getBytes(value, copy) {
    if (value instanceof Uint8Array) {
        if (copy) {
            return new Uint8Array(value);
        }
        return value;
    }

    if (typeof (value) === "string" && value.match(/^0x([0-9a-f][0-9a-f])*$/i)) {
        const result = new Uint8Array((value.length - 2) / 2);
        let offset = 2;
        for (let i = 0; i < result.length; i++) {
            result[i] = parseInt(value.substring(offset, offset + 2), 16);
            offset += 2;
        }
        return result;
    }
    return undefined;
}

function getBytes(value) {
    return _getBytes(value, false);
}

export function EncodeBlobs(data) {
    const len = data.length;
    if (len === 0) {
        throw Error('invalid blob data')
    }

    let blobIndex = 0;
    let fieldIndex = -1;

    const blobs = [new Uint8Array(BLOB_SIZE).fill(0)];
    for (let i = 0; i < len; i += 31) {
        fieldIndex++;
        if (fieldIndex === BlobTxFieldElementsPerBlob) {
            blobs.push(new Uint8Array(BLOB_SIZE).fill(0));
            blobIndex++;
            fieldIndex = 0;
        }
        let max = i + 31;
        if (max > len) {
            max = len;
        }
        blobs[blobIndex].set(data.subarray(i, max), fieldIndex * 32 + 1);
    }
    return blobs;
}

export function DecodeBlob(blob) {
    if (!blob) {
        throw Error('invalid blob data')
    }

    blob = getBytes(blob);
    if (blob.length < BLOB_SIZE) {
        const newBlob = new Uint8Array(BLOB_SIZE).fill(0);
        newBlob.set(blob);
        blob = newBlob;
    }

    let data = [];
    let j = 0
    for (let i = 0; i < BlobTxFieldElementsPerBlob; i++) {
        const chunk = blob.subarray(j + 1, j + 32);
        data = [...data, ...chunk];
        j += 32;
    }
    let i = data.length - 1;
    for (; i >= 0; i--) {
        if (data[i] !== 0x00) {
            break
        }
    }
    const newData = data.slice(0, i + 1);
    return newData;
}

export function DecodeBlobs(blobs) {
    if (!blobs) {
        throw Error('invalid blobs')
    }

    blobs = getBytes(blobs);
    const len = blobs.length;
    if (len === 0) {
        throw Error('invalid blobs')
    }

    let buf = [];
    for (let i = 0; i < len; i += BLOB_SIZE) {
        let max = i + BLOB_SIZE;
        if (max > len) {
            max = len;
        }
        const blob = blobs.subarray(i, max);
        const blobBuf = DecodeBlob(blob);
        buf = [...buf, ...blobBuf];
    }
    return new Buffer(buf);
}

function parseBigintValue(value) {
    if (value) {
        if(typeof value == 'bigint') {
            return '0x' + value.toString(16);
        }
        if (typeof value == 'object') {
            return ethers.utils.hexValue(value);
        }
    }
    return value;
}

// get blob gas
// const block = await this.#provider.getBlock("latest");
// console.log(block);
// function getBlobGasPrice(): bigint {
//     if (this.excessBlobGas === undefined) {
//         throw new Error('header must have excessBlobGas field populated')
//     }
//     return fakeExponential(
//         this.common.param('gasPrices', 'minBlobGasPrice'),
//         this.excessBlobGas,
//         this.common.param('gasConfig', 'blobGasPriceUpdateFraction')
//     )
// }
// const fakeExponential = (factor: bigint, numerator: bigint, denominator: bigint) => {
//     let i = BigInt(1)
//     let output = BigInt(0)
//     let numerator_accum = factor * denominator
//     while (numerator_accum > BigInt(0)) {
//         output += numerator_accum
//         numerator_accum = (numerator_accum * numerator) / (denominator * i)
//         i++
//     }
//     return output / denominator
// }


export class Send4844Tx {
    constructor(rpc, pk) {
        this.jsonRpc = rpc;
        this.privateKey = pk;
        this.provider = new ethers.providers.JsonRpcProvider(rpc);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    }

    async sendRpcCall(method, parameters) {
        try {
            let response = await axios({
                method: "POST",
                url: this.jsonRpc,
                data: {
                    jsonrpc: "2.0",
                    method: method,
                    params: parameters,
                    id: 67
                },
            });
            console.log('send response', response.data);
            let returnedValue = response.data.result;
            if (returnedValue === "0x") {
                return null;
            }
            return returnedValue;
        } catch (error) {
            console.log('send error', error);
            return null;
        }
    }

    async sendRawTransaction(param) {
        return await this.sendRpcCall("eth_sendRawTransaction", [param]);
    }

    async getChainId() {
        if (this.chainId == null) {
            this.chainId = await this.sendRpcCall("eth_chainId", []);
        }
        return this.chainId;
    }

    async getNonce() {
        return await this.wallet.getTransactionCount("pending");
    }

    async getFee() {
        return await this.provider.getFeeData();
    }

    async estimateGas(params) {
        return await this.sendRpcCall("eth_estimateGas", [params]);
    }

    async sendTx(blobs, proofs, commitments, versionedHashes, tx) {
        const chain = await this.getChainId();

        let {chainId, nonce, to, value, data, maxPriorityFeePerGas, maxFeePerGas, gasLimit, maxFeePerBlobGas} = tx;
        if (chainId == null) {
            chainId = chain;
        } else {
            chainId = parseBigintValue(chainId);
            if (ethers.utils.isHexString(chainId)) {
                chainId = parseInt(chainId, 16)
            }
            if (chainId !== parseInt(chain, 16)) {
                throw Error('invalid network id')
            }
        }

        if (nonce == null) {
            nonce = await this.getNonce();
        }

        value = value == null ? '0x0' : parseBigintValue(value);

        if (gasLimit == null) {
            const params = { from: this.wallet.address, to, data, value };
            gasLimit = await this.estimateGas(params);
            if (gasLimit == null) {
                throw Error('estimateGas: execution reverted')
            }
        } else {
            gasLimit = parseBigintValue(gasLimit);
        }

        if (maxFeePerGas == null) {
            const fee = await this.getFee();
            maxPriorityFeePerGas = fee.maxPriorityFeePerGas.toHexString();
            maxFeePerGas = fee.maxFeePerGas.toHexString();
        } else {
            maxFeePerGas = parseBigintValue(maxFeePerGas);
            maxPriorityFeePerGas = parseBigintValue(maxPriorityFeePerGas);
        }

        // TODO
        maxFeePerBlobGas = maxFeePerBlobGas == null ? 30000000000n : parseBigintValue(maxFeePerBlobGas);

        // blobs

        // send
        const common = Common.custom(
            {
                name: 'custom-chain',
                networkId: chainId,
                chainId: chainId,
            },
            {
                baseChain: 1,
                eips: [1559, 3860, 4844]
            }
        );
        const unsignedTx = new BlobEIP4844Transaction(
            {
                chainId,
                nonce,
                to,
                value,
                data,
                maxPriorityFeePerGas,
                maxFeePerGas,
                gasLimit,
                maxFeePerBlobGas,
                blobVersionedHashes: versionedHashes,
                blobs,
                kzgCommitments: commitments,
                kzgProofs: proofs,
            },
            {common}
        );

        const pk = getBytes(this.privateKey);
        const signedTx = unsignedTx.sign(pk);
        const rawData = signedTx.serializeNetworkWrapper();

        const hex = new Buffer(rawData).toString('hex');
        return await this.sendRawTransaction('0x' + hex);
    }

    async isTransactionMined(transactionHash) {
        const txReceipt = await this.provider.getTransactionReceipt(transactionHash);
        if (txReceipt && txReceipt.blockNumber) {
            return txReceipt;
        }
    }

    async getTxReceipt(transactionHash) {
        let txReceipt;
        while (!txReceipt) {
            txReceipt = await this.isTransactionMined(transactionHash);
            if (txReceipt) break;
            await sleep(5000);
        }
        return txReceipt;
    }
}

export async function GenerateBlobs(blobs) {
    try {
        const {data} = await axios.post(API_URL, {blobs: blobs})
        return data;
    } catch (error) {
        console.log('send error', error);
        return null;
    }
}

export function getBlobHash(localHash) {
    localHash = getBytes(localHash);
    const hash = new Uint8Array(32);
    hash.set(localHash.subarray(0, 32 - 8));
    return ethers.utils.hexlify(hash);
}
