// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import {FS_Core} from "./FS_Core.sol";

contract FS_Vault is Ownable, ReentrancyGuard, ERC721Holder, ERC1155Holder {
    FS_Core private immutable fsCore;

    constructor(address _owner) Ownable(_owner) { 
      fsCore = FS_Core(_owner);
    }

    receive() external payable {}

    function sendEth(address[] calldata ethAddresses, uint256[] calldata ethValues) internal {
      for (uint256 i = 0; i < ethAddresses.length; i++) {
        if (ethValues[i] > 0){
          (bool success,) = ethAddresses[i].call{value: ethValues[i]}("");
          if (!success) revert();
        }
      }
    }

    function sendTokens(bytes[] calldata tokenCalldatas) internal {
      fsCore.multicall(tokenCalldatas);
    }

    function executeCalls(address[] calldata ethAddresses, uint256[] calldata ethValues, bytes[] calldata tokenCalldatas) external payable onlyOwner nonReentrant {
      if (ethAddresses.length > 0) sendEth(ethAddresses, ethValues);
      if (tokenCalldatas.length > 0) sendTokens(tokenCalldatas);
    }
}