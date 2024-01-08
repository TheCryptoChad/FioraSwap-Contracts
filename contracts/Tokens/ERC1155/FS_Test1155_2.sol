// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract FS_Test1155_2 is ERC1155 {
    string private _name;
    string private _symbol;

    mapping(address => uint256) private _hasMinted;

    constructor() ERC1155("") {
        _name = "FS_Test1155_2";
        _symbol = "FS_T1155_2";
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public {
        require(_hasMinted[msg.sender] < 3, "FST::Can't mint more");
        _mintBatch(to, ids, amounts, data);
        _hasMinted[msg.sender] += 1;
    }
}