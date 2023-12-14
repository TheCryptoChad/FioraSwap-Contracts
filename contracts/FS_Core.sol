// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {FS_Vault} from "./FS_Vault.sol";
import {FS_Util} from "./FS_Util.sol";

contract FS_Core {
  FS_Vault private immutable fsVault;
  uint256 private offerCount;
  FS_Util.Offer[] private offers;

  event CreateOffer(uint256 indexed id);
  event AcceptOffer(uint256 indexed id, address indexed taker, uint256 indexed takerFee);
  event CancelOffer(uint256 indexed id);

  constructor() {
    fsVault = new FS_Vault(address(this));
    offers.push();
    offerCount++;
  }

  function createOffer(FS_Util.Offer memory offer, bytes[] calldata tokenCalldatas) external payable {
    require(msg.value == offer.maker.eth + offer.maker.fee);

    address[] memory ethAddresses;
    uint256[] memory ethValues;

    fsVault.executeCalls{value: offer.maker.eth}(ethAddresses, ethValues, tokenCalldatas);

    offer.id = offerCount;
    offer.maker.sent = true;

    offerCount++;
    offers.push(offer);

    emit CreateOffer(offer.id);
  }

  function acceptOffer(uint256 id, uint256 takerFee, bytes[] calldata tokenCalldatas) external payable {
    FS_Util.Offer memory offer = offers[id];

    require(msg.sender != offer.maker.walletAddress);
    require(msg.value == offer.taker.eth + takerFee);
    require(offer.status == FS_Util.Status.ACTIVE);

    address[] memory ethAddresses;
    ethAddresses[0] = offer.maker.walletAddress;
    ethAddresses[1] = offer.taker.walletAddress;

    uint256[] memory ethValues;
    ethValues[0] = offer.taker.eth;
    ethValues[1] = offer.maker.eth;

    fsVault.executeCalls{value: offer.taker.eth}(ethAddresses, ethValues, tokenCalldatas);

    offer.taker.walletAddress = msg.sender;
    offer.taker.fee = takerFee;
    offer.taker.sent = true;
    offer.status = FS_Util.Status.COMPLETED;

    offers[id] = offer;

    emit AcceptOffer(offer.id, offer.taker.walletAddress, offer.taker.fee);
  }

  function cancelOffer(uint256 id, bytes[] calldata tokenCalldatas) external {
    FS_Util.Offer memory offer = offers[id];

    require(msg.sender == offer.maker.walletAddress);
    require(offer.status == FS_Util.Status.ACTIVE);

    address[] memory ethAddresses;
    ethAddresses[0] = offer.maker.walletAddress;

    uint256[] memory ethValues;
    ethValues[0] = offer.maker.eth;

    fsVault.executeCalls(ethAddresses, ethValues, tokenCalldatas);

    offer.status = FS_Util.Status.CANCELLED;
    
    offers[id] = offer;

    emit CancelOffer(offer.id);
  }

  function getFsVaultAddress() external view returns (address) {
    return address(fsVault);
  }

  function getOffer(uint256 id) external view returns (FS_Util.Offer memory) {
    return offers[id];
  }

  function multicall(bytes[] calldata data) external {
    bytes memory context = new bytes(0);
    
    for (uint256 i = 0; i < data.length; i++) {
      Address.functionDelegateCall(address(this), bytes.concat(data[i], context));
    }
  }
}