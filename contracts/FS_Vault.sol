// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import {FS_Util} from "./FS_Util.sol";

contract FS_Vault is ReentrancyGuard, Ownable, ERC721Holder, ERC1155Holder {

    constructor(address _owner) Ownable(_owner) {}

    fallback() external payable {}

    receive() external payable {}

    function executeCalls(address[] calldata nativeAddresses, uint256[] calldata nativeValues, FS_Util.Call[] calldata callDatas) external payable onlyOwner nonReentrant {
      uint256 i;
      
      if (nativeAddresses.length > 0) {
        do {
          (bool success,) = nativeAddresses[i].call{value: nativeValues[i]}("");

          if (!success) revert();

          unchecked{++i;}
        } while (i < nativeAddresses.length);
      }
      
      i = 0;

      if (callDatas.length > 0) {
        do {
          (bool success, bytes memory returnData) = callDatas[i].target.call(callDatas[i].callData);

          if (!success) {
            assembly {
              revert(add(returnData, 32), mload(returnData))
            }
          }

          unchecked{++i;}
        } while (i < callDatas.length);
      }
    }
}