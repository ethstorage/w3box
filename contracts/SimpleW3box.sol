// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";

interface FlatDirectoryFactoryInterface {
    function create() external returns (address);
}

interface IERC5018 {
    enum StorageMode {
        Uninitialized,
        OnChain,
        Blob
    }

    struct FileChunk {
        bytes name;
        uint256[] chunkIds;
    }

    // Large storage methods
    function write(bytes memory name, bytes memory data) external payable;

    function read(bytes memory name) external view returns (bytes memory, bool);

    // return (size, # of chunks)
    function size(bytes memory name) external view returns (uint256, uint256);

    function remove(bytes memory name) external returns (uint256);

    function countChunks(bytes memory name) external view returns (uint256);

    // Chunk-based large storage methods
    function writeChunk(
        bytes memory name,
        uint256 chunkId,
        bytes memory data
    ) external payable;

    function writeChunks(bytes memory name, uint256[] memory chunkIds, uint256[] memory sizes) external payable;

    function readChunk(bytes memory name, uint256 chunkId) external view returns (bytes memory, bool);

    function chunkSize(bytes memory name, uint256 chunkId) external view returns (uint256, bool);

    function removeChunk(bytes memory name, uint256 chunkId) external returns (bool);

    function truncate(bytes memory name, uint256 chunkId) external returns (uint256);

    function refund() external;

    function destruct() external;

    function getChunkHash(bytes memory name, uint256 chunkId) external view returns (bytes32);

    function getChunkHashesBatch(FileChunk[] memory fileChunks) external view returns (bytes32[] memory);

    function getChunkCountsBatch(bytes[] memory names) external view returns (uint256[] memory);

    function getUploadInfo(bytes memory name) external view returns (StorageMode mode, uint256 chunkCount, uint256 storageCost);
}

contract SimpleW3box {
    using Strings for uint256;

    // event for EVM logging
    event OwnerSet(address indexed oldOwner, address indexed newOwner);

    // modifier to check if caller is owner
    modifier isOwner() {
        // If the first argument of 'require' evaluates to 'false', execution terminates and all
        // changes to the state and to Ether balances are reverted.
        // This used to consume all gas in old EVM versions, but not anymore.
        // It is often a good idea to use 'require' to check if functions are called correctly.
        // As a second argument, you can also provide an explanation about what went wrong.
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    struct File {
        uint256 time;
        bytes name;
        bytes fileType;
    }

    struct FilesInfo {
        File[] files;
        mapping(bytes32 => uint256) fileIds;
    }

    IERC5018 public fileFD;

    address public owner;
    string public chainId;

    mapping(address => FilesInfo) fileInfos;

    constructor(string memory _chainId, address _factory) {
        owner = msg.sender;
        chainId = _chainId;
        FlatDirectoryFactoryInterface factory = FlatDirectoryFactoryInterface(_factory);
        fileFD = IERC5018(factory.create());
    }

    receive() external payable {
    }

    function setChainId(string calldata _chainId) public isOwner {
        chainId = _chainId;
    }

    function write(bytes memory name, bytes memory fileType, bytes calldata data) public payable {
        writeChunk(name, fileType, 0, data);
    }

    function writeChunk(bytes memory name, bytes memory fileType, uint256 chunkId, bytes calldata data) public payable {
        bytes32 nameHash = keccak256(name);
        FilesInfo storage info = fileInfos[msg.sender];
        if (info.fileIds[nameHash] == 0) {
            // first add file
            info.files.push(File(block.timestamp, name, fileType));
            info.fileIds[nameHash] = info.files.length;
        }

        fileFD.writeChunk{value: msg.value}(getNewName(msg.sender, name), chunkId, data);
    }

    function removes(bytes[] memory names) public {
        for (uint256 i; i < names.length; i++) {
            remove(names[i]);
        }
    }

    function remove(bytes memory name) public returns (uint256) {
        bytes32 nameHash = keccak256(name);
        FilesInfo storage info = fileInfos[msg.sender];
        require(info.fileIds[nameHash] != 0, "File does not exist");

        uint256 lastIndex = info.files.length - 1;
        uint256 removeIndex = info.fileIds[nameHash] - 1;
        if (lastIndex != removeIndex) {
            File storage lastFile = info.files[lastIndex];
            info.files[removeIndex] = lastFile;
            info.fileIds[keccak256(lastFile.name)] = removeIndex + 1;
        }
        info.files.pop();
        delete info.fileIds[nameHash];

        uint256 id = fileFD.remove(getNewName(msg.sender, name));
        fileFD.refund();
        payable(msg.sender).transfer(address(this).balance);
        return id;
    }

    function getChunkHash(bytes memory name, uint256 chunkId) public view returns (bytes32) {
        return fileFD.getChunkHash(getNewName(msg.sender, name), chunkId);
    }

    function countChunks(bytes memory name) public view returns (uint256) {
        return fileFD.countChunks(getNewName(msg.sender, name));
    }

    function getNewName(address author, bytes memory name) public pure returns (bytes memory) {
        return abi.encodePacked(
            Strings.toHexString(uint256(uint160(author)), 20),
            '/',
            name
        );
    }

    function getUrl(bytes memory name) public view returns (string memory) {
        // https://0xf208000076869ca535575baddd9152ac0a05986c.3333.w3link.io/app.html
        return string(abi.encodePacked(
                'https://',
                Strings.toHexString(uint256(uint160(address(fileFD))), 20),
                ".",
                chainId,
                '.w3link.io/',
                name
            ));
    }

    function getAuthorFiles(address author)
        public view
        returns (
            uint256[] memory times,
            bytes[] memory names,
            bytes[] memory types,
            string[] memory urls
        )
    {
        uint256 length = fileInfos[author].files.length;
        times = new uint256[](length);
        names = new bytes[](length);
        types = new bytes[](length);
        urls = new string[](length);

        for (uint256 i; i < length; i++) {
            times[i] = fileInfos[author].files[i].time;
            names[i] = fileInfos[author].files[i].name;
            types[i] = fileInfos[author].files[i].fileType;
            urls[i] = getUrl(getNewName(author, names[i]));
        }
    }
}
