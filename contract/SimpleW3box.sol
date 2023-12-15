// Sources flattened with hardhat v2.8.3 https://hardhat.org

// File @openzeppelin/contracts/utils/Strings.sol@v4.3.2

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev String operations.
 */
library Strings {
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0x00";
        }
        uint256 temp = value;
        uint256 length = 0;
        while (temp != 0) {
            length++;
            temp >>= 8;
        }
        return toHexString(value, length);
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
}


// File @openzeppelin/contracts/utils/Context.sol@v4.3.2


pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v4.3.2


pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _setOwner(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _setOwner(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _setOwner(newOwner);
    }

    function _setOwner(address newOwner) private {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File contracts/IERC5018ForBlob.sol

pragma solidity ^0.8.0;

    enum DecodeType {
        RawData,
        PaddingPer31Bytes
    }

interface IERC5018ForBlob {

    function read(bytes memory name, DecodeType decodeType) external view returns (bytes memory, bool);

    // return (size, # of chunks)
    function size(bytes memory name) external view returns (uint256, uint256);

    function remove(bytes memory name) external returns (uint256);

    function countChunks(bytes memory name) external view returns (uint256);

    function readChunk(bytes memory name, DecodeType decodeType, uint256 chunkId) external view returns (bytes memory, bool);

    function chunkSize(bytes memory name, uint256 chunkId) external view returns (uint256, bool);

    function removeChunk(bytes memory name, uint256 chunkId) external returns (bool);

    function truncate(bytes memory name, uint256 chunkId) external returns (uint256);

    function refund() external;

    function destruct() external;

    function getChunkHash(bytes memory name, uint256 chunkId) external view returns (bytes32);

    function writeChunk(bytes memory name, uint256[] memory chunkIds, uint256[] memory sizes) external payable;

    function upfrontPayment() external view returns (uint256);
}


// File contracts/ERC5018ForBlob.sol

pragma solidity ^0.8.0;


interface EthStorageContract {
    function putBlob(bytes32 key, uint256 blobIdx, uint256 length) external payable;

    function get(bytes32 key, DecodeType decodeType, uint256 off, uint256 len) external view returns (bytes memory);

    function remove(bytes32 key) external;

    function hash(bytes32 key) external view returns (bytes24);

    function upfrontPayment() external view returns (uint256);
}

contract ERC5018ForBlob is IERC5018ForBlob, Ownable {

    uint32 BLOB_SIZE = 4096 * 32;
    uint32 DECODE_BLOB_SIZE = 4096 * 31;

    EthStorageContract public storageContract;

    mapping(bytes32 => bytes32[]) internal keyToChunk;
    mapping(bytes32 => uint256) internal chunkSizes;

    function setEthStorageContract(address storageAddress) public onlyOwner {
        storageContract = EthStorageContract(storageAddress);
    }

    function _countChunks(bytes32 key) internal view returns (uint256) {
        return keyToChunk[key].length;
    }

    function _chunkSize(bytes32 key, uint256 chunkId) internal view returns (uint256, bool) {
        if (chunkId >= _countChunks(key)) {
            return (0, false);
        }
        bytes32 chunkKey = keyToChunk[key][chunkId];
        return (chunkSizes[chunkKey], true);
    }

    function _size(bytes32 key) internal view returns (uint256, uint256) {
        uint256 size_ = 0;
        uint256 chunkId_ = 0;
        while (true) {
            (uint256 chunkSize_, bool found) = _chunkSize(key, chunkId_);
            if (!found) {
                break;
            }
            size_ += chunkSize_;
            chunkId_++;
        }

        return (size_, chunkId_);
    }

    function _getChunk(bytes32 key, DecodeType decodeType, uint256 chunkId) internal view returns (bytes memory, bool) {
        (uint256 length,) = _chunkSize(key, chunkId);
        if (length < 1) {
            return (new bytes(0), false);
        }

        bytes memory data = storageContract.get(keyToChunk[key][chunkId], decodeType, 0, length);
        return (data, true);
    }

    function _get(bytes32 key, DecodeType decodeType) internal view returns (bytes memory, bool) {
        (uint256 fileSize, uint256 chunkNum) = _size(key);
        if (chunkNum == 0) {
            return (new bytes(0), false);
        }

        bytes memory concatenatedData = new bytes(fileSize);
        uint256 offset = 0;
        for (uint256 chunkId = 0; chunkId < chunkNum; chunkId++) {
            bytes32 chunkKey = keyToChunk[key][chunkId];
            uint256 length = chunkSizes[chunkKey];
            storageContract.get(chunkKey, decodeType, 0, length);

            assembly {
                returndatacopy(add(add(concatenatedData, offset), 0x20), 0x40, length)
            }
            offset += length;
        }

        return (concatenatedData, true);
    }

    function _removeChunk(bytes32 key, uint256 chunkId) internal returns (bool) {
        require(_countChunks(key) - 1 == chunkId, "only the last chunk can be removed");
        storageContract.remove(keyToChunk[key][chunkId]);
        keyToChunk[key].pop();
        return true;
    }

    function _remove(bytes32 key, uint256 chunkId) internal returns (uint256) {
        require(_countChunks(key) > 0, "the file has no content");

        for (uint256 i = _countChunks(key) - 1; i >= chunkId;) {
            storageContract.remove(keyToChunk[key][chunkId]);
            keyToChunk[key].pop();
            if (i == 0) {
                break;
            } else {
                i--;
            }
        }
        return chunkId;
    }

    function _preparePut(bytes32 key, uint256 chunkId) private {
        require(chunkId <= _countChunks(key), "must replace or append");
        if (chunkId < _countChunks(key)) {
            // replace, delete old blob
            storageContract.remove(keyToChunk[key][chunkId]);
        }
    }

    function _putChunks(
        bytes32 key,
        uint256[] memory chunkIds,
        uint256[] memory sizes
    ) internal {
        uint256 length = chunkIds.length;
        uint256 cost = storageContract.upfrontPayment();
        require(msg.value >= cost * length, "insufficient balance");

        for (uint8 i = 0; i < length; i++) {
            require(sizes[i] <= DECODE_BLOB_SIZE, "invalid chunk length");
            _preparePut(key, chunkIds[i]);

            bytes32 chunkKey = keccak256(abi.encode(msg.sender, block.timestamp, chunkIds[i], i));
            storageContract.putBlob{value : cost}(chunkKey, i, BLOB_SIZE);
            if (chunkIds[i] < _countChunks(key)) {
                // replace
                keyToChunk[key][chunkIds[i]] = chunkKey;
            } else {
                // add
                keyToChunk[key].push(chunkKey);
            }
            chunkSizes[chunkKey] = sizes[i];
        }
    }



    // interface methods
    function read(bytes memory name, DecodeType decodeType) public view override returns (bytes memory, bool) {
        return _get(keccak256(name), decodeType);
    }

    function size(bytes memory name) public view override returns (uint256, uint256) {
        return _size(keccak256(name));
    }

    function remove(bytes memory name) public onlyOwner override returns (uint256) {
        return _remove(keccak256(name), 0);
    }

    function countChunks(bytes memory name) public view override returns (uint256) {
        return _countChunks(keccak256(name));
    }

    function readChunk(bytes memory name, DecodeType decodeType, uint256 chunkId) public view override returns (bytes memory, bool) {
        return _getChunk(keccak256(name), decodeType, chunkId);
    }

    function chunkSize(bytes memory name, uint256 chunkId) public view override returns (uint256, bool) {
        return _chunkSize(keccak256(name), chunkId);
    }

    function removeChunk(bytes memory name, uint256 chunkId) public onlyOwner override returns (bool) {
        return _removeChunk(keccak256(name), chunkId);
    }

    function truncate(bytes memory name, uint256 chunkId) public onlyOwner override returns (uint256) {
        return _remove(keccak256(name), chunkId);
    }

    function refund() public onlyOwner override {
        payable(owner()).transfer(address(this).balance);
    }

    function destruct() public onlyOwner override {
        selfdestruct(payable(owner()));
    }

    function getChunkHash(bytes memory name, uint256 chunkId) public view returns (bytes32) {
        bytes32 key = keccak256(name);
        if (chunkId >= _countChunks(key)) {
            return bytes32(0);
        }
        return storageContract.hash(keyToChunk[key][chunkId]);
    }

    // Chunk-based large storage methods
    function writeChunk(bytes memory name, uint256[] memory chunkIds, uint256[] memory sizes) public onlyOwner override payable {
        _putChunks(keccak256(name), chunkIds, sizes);
        refund();
    }

    function upfrontPayment() external override view returns (uint256) {
        return storageContract.upfrontPayment();
    }
}


// File contracts/examples/FlatDirectoryForBlob.sol


pragma solidity ^0.8.0;

contract FlatDirectoryForBlob is ERC5018ForBlob {
    bytes public defaultFile = "";

    function resolveMode() external pure virtual returns (bytes32) {
        return "manual";
    }

    fallback(bytes calldata pathinfo) external returns (bytes memory)  {
        bytes memory content;
        if (pathinfo.length == 0) {
            // TODO: redirect to "/"?
            return bytes("");
        } else if (pathinfo[0] != 0x2f) {
            // Should not happen since manual mode will have prefix "/" like "/....."
            return bytes("incorrect path");
        }

        if (pathinfo[pathinfo.length - 1] == 0x2f) {
            (content,) = read(bytes.concat(pathinfo[1 :], defaultFile), DecodeType.PaddingPer31Bytes);
        } else {
            (content,) = read(pathinfo[1 :], DecodeType.PaddingPer31Bytes);
        }

        returnBytesInplace(content);
    }

    function returnBytesInplace(bytes memory content) internal pure {
        // equal to return abi.encode(content)
        uint256 size = content.length + 0x40; // pointer + size
        size = (size + 0x20 + 0x1f) & ~uint256(0x1f);
        assembly {
        // (DATA CORRUPTION): the caller method must be "external returns (bytes)", cannot be public!
            mstore(sub(content, 0x20), 0x20)
            return (sub(content, 0x20), size)
        }
    }

    function setDefault(bytes memory _defaultFile) public onlyOwner virtual {
        defaultFile = _defaultFile;
    }
}


// File contracts/examples/SimpleW3boxBlobs.sol


pragma solidity ^0.8.0;


contract SimpleW3box {
    using Strings for uint256;

    struct File {
        uint256 time;
        bytes name;
        bytes fileType;
    }

    struct FileInfos {
        File[] files;
        mapping(bytes32 => uint256) fileIds;
    }

    struct UserInfo {
        address addr;
        bytes encrypt;
        bytes cipherIV;
    }

    FlatDirectoryForBlob public fileFD;
    string public shortNetwork;

    mapping(address => FileInfos) fileInfos;
    mapping(address => UserInfo) userInfos;
    mapping(address => address) sessionMap; // Session Address => User Address

    constructor(string memory _shortNetwork) {
        shortNetwork = _shortNetwork;
        fileFD = new FlatDirectoryForBlob();
        fileFD.setEthStorageContract(0x9f9F5Fd89ad648f2C000C954d8d9C87743243eC5);
    }

    receive() external payable {
    }

    function createSession(address addr, bytes memory iv, bytes memory encrypt) public {
        UserInfo storage info = userInfos[msg.sender];
        require(info.addr == address(0), "Session is created");

        info.addr = addr;
        info.encrypt = encrypt;
        info.cipherIV = iv;

        sessionMap[msg.sender] = addr;
    }

    function isCorrectAuthor(address author) private view returns (bool) {
        if (author == address(0)) return false;
        if (author != msg.sender) {
            return sessionMap[msg.sender] == author;
        } else {
            return sessionMap[msg.sender] == address(0);
        }
    }

    function writeChunk(
        address author,
        bytes memory name,
        bytes memory fileType,
        uint256[] memory chunkIds,
        uint256[] memory sizes
    ) public payable {
        require(isCorrectAuthor(author), "wrong author");

        FileInfos storage info = fileInfos[author];
        bytes32 nameHash = keccak256(name);
        if (info.fileIds[nameHash] == 0) {
            // first add file
            info.files.push(File(block.timestamp, name, fileType));
            info.fileIds[nameHash] = info.files.length;
        }

        fileFD.writeChunk{value : msg.value}(getNewName(author, name), chunkIds, sizes);
    }

    function remove(address author, bytes memory name) public returns (uint256) {
        require(isCorrectAuthor(author), "wrong author");

        FileInfos storage info = fileInfos[author];
        bytes32 nameHash = keccak256(name);
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

        uint256 id = fileFD.remove(getNewName(author, name));
        fileFD.refund();
        payable(author).transfer(address(this).balance);
        return id;
    }

    function removes(address author, bytes[] memory names) public {
        uint256 length = names.length;
        for (uint8 i = 0; i < length; i++) {
            remove(author, names[i]);
        }
    }

    function getChunkHash(address author, bytes memory name, uint256 chunkId) public view returns (bytes32) {
        return fileFD.getChunkHash(getNewName(author, name), chunkId);
    }

    function countChunks(address author, bytes memory name) public view returns (uint256) {
        return fileFD.countChunks(getNewName(author, name));
    }

    function getUrl(bytes memory name) public view returns (string memory) {
        // https://file.w3q.w3q-g.w3link.io/0xb5a0ba79d7f63571b7ba81c9ab30e8f9a72b858f/coin.png
        return string(abi.encodePacked(
                'https://',
                Strings.toHexString(uint256(uint160(address(fileFD))), 20),
                '.',
                shortNetwork,
                '.w3link.io/',
                name
            ));
    }

    function getNewName(address author, bytes memory name) public pure returns (bytes memory) {
        return abi.encodePacked(
            Strings.toHexString(uint256(uint160(author)), 20),
            '/',
            name
        );
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

    function getSession() public view returns (address addr, bytes memory iv, bytes memory encrypt) {
        UserInfo storage info = userInfos[msg.sender];
        return (info.addr, info.cipherIV, info.encrypt);
    }

    function upfrontPayment() external view returns (uint256) {
        return fileFD.upfrontPayment();
    }
}
