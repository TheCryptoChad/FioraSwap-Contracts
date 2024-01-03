// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

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

  function createOffer(FS_Util.Offer memory offer, FS_Util.Call[] calldata tokenCalldatas) external payable {
    require(msg.value == offer.maker.native + offer.maker.fee);

    address[] memory nativeAddresses;
    uint256[] memory nativeValues;

    fsVault.executeCalls{value: offer.maker.native}(nativeAddresses, nativeValues, tokenCalldatas);

    offer.id = offerCount;
    offer.maker.sent = true;

    offerCount++;
    offers.push(offer);

    emit CreateOffer(offer.id);
  }

  function acceptOffer(uint256 id, uint256 takerFee, FS_Util.Call[] calldata tokenCalldatas) external payable {
    FS_Util.Offer memory offer = offers[id];

    require(msg.sender != offer.maker.walletAddress);
    require(msg.value == offer.taker.native + takerFee);
    require(offer.status == FS_Util.Status.ACTIVE);

    address[] memory nativeAddresses = new address[](2);
    nativeAddresses[0] = offer.maker.walletAddress;
    nativeAddresses[1] = msg.sender;

    uint256[] memory nativeValues = new uint256[](2);
    nativeValues[0] = offer.taker.native;
    nativeValues[1] = offer.maker.native;

    fsVault.executeCalls{value: offer.taker.native}(nativeAddresses, nativeValues, tokenCalldatas);

    offer.taker.walletAddress = msg.sender;
    offer.taker.fee = takerFee;
    offer.taker.sent = true;
    offer.status = FS_Util.Status.COMPLETED;

    offers[id] = offer;

    emit AcceptOffer(offer.id, offer.taker.walletAddress, offer.taker.fee);
  }

  function cancelOffer(uint256 id, FS_Util.Call[] calldata tokenCalldatas) external {
    FS_Util.Offer memory offer = offers[id];

    require(msg.sender == offer.maker.walletAddress);
    require(offer.status == FS_Util.Status.ACTIVE);

    address[] memory nativeAddresses = new address[](1);
    nativeAddresses[0] = offer.maker.walletAddress;

    uint256[] memory nativeValues = new uint256[](1);
    nativeValues[0] = offer.maker.native;

    fsVault.executeCalls(nativeAddresses, nativeValues, tokenCalldatas);

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
}