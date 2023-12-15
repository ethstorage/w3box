import { FileContract } from "./request";

// contract
export const getUploadByAddress = async (controller, address) => {
    const fileContract = FileContract(controller);
    const result = await fileContract.getAuthorFiles(address);
    const files = [];
    const ids = result[0];
    const times = result[1];
    const names = result[2];
    const urls = result[3];
    for (let i = 0; i < urls.length; i++) {
        const file = {
            id: ids[i].toString(),
            time: new Date(parseInt(times[i], 10) * 1000),
            name: names[i],
            type: '0x',
            url: urls[i],
            showProgress: false
        };
        files.push(file);
    }
    files.sort(function (a, b) {
        return a.time - b.time
    });
    console.log(files)
    return files;
}

export const deleteFile = async (controller, file) => {
    const fileContract = FileContract(controller);
    const tx = await fileContract.remove(file);
    const receipt = await tx.wait();
    return receipt.status;
}

export const deleteFiles = async (controller, files) => {
    const fileContract = FileContract(controller);
    const tx = await fileContract.removes(files);
    const receipt = await tx.wait();
    return receipt.status;
}
