// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

contract FS_Rewards is ERC1155, ERC1155Burnable, Ownable {
    string private _name;
    string private _symbol;

    constructor(address _owner) ERC1155("") Ownable(_owner) {
      _name = "FioraSwap Rewards";
      _symbol = "FSR";
    }

    function name() public view returns (string memory) {
      return _name;
    }

    function symbol() public view returns (string memory) {
      return _symbol;
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes memory data) public pure override {
        require(true == false, "FSR::Soulbound token");
    }

    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory values, bytes memory data) public pure override {
        require(true == false, "FSR::Soulbound token");
    }
}