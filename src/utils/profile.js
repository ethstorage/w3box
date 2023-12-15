import {FileContract, FileContractSession} from "./contract";
import {getSessionKey} from "@/utils/Session";

// contract
export const getUploadByAddress = async (controller, address) => {
    const fileContract = FileContract(controller);
    const result = await fileContract.getAuthorFiles(address);
    const files = [];
    const times = result[0];
    const names = result[1];
    const types = result[2];
    const urls = result[3];
    for (let i = 0; i < urls.length; i++) {
        const file = {
            time: new Date(parseInt(times[i], 10) * 1000),
            name: names[i],
            type: types[i],
            url: urls[i],
            showProgress: false
        };
        files.push(file);
    }
    files.sort(function (a, b) {
        return a.time - b.time
    });
    return files;
}

export const deleteFile = async (controller, account, file) => {
    let pk = getSessionKey(account);
    pk = '0x' + Buffer.from(pk, 'base64').toString('hex');
    const fileContract = await FileContractSession(controller, pk);
    const tx = await fileContract.remove(account, file);
    const receipt = tx.wait();
    return receipt.status;
}

export const deleteFiles = async (controller, account, files) => {
    let pk = getSessionKey(account);
    pk = '0x' + Buffer.from(pk, 'base64').toString('hex');
    const fileContract = await FileContractSession(controller, pk);
    const tx = await fileContract.removes(account, files);
    const receipt = tx.wait();
    return receipt.status;
}
