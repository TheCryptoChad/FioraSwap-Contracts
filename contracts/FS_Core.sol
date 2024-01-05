// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {FS_Vault} from "./FS_Vault.sol";
import {FS_Rewards} from "./FS_Rewards.sol";
import {FS_Util} from "./FS_Util.sol";

contract FS_Core is Ownable {
  FS_Vault private immutable fsVault;
  FS_Rewards private immutable fsRewards;
  address private immutable oracleAddress;

  uint256 private offerCount;
  mapping(uint256 => FS_Util.Offer) private offers;

  mapping(uint256 => bool) private nonces;

  event CreateOffer(uint256 indexed id);
  event AcceptOffer(uint256 indexed id, address indexed taker, uint256 indexed takerFee);
  event CancelOffer(uint256 indexed id);
  event CraftReward(uint256 indexed id, address indexed crafter);

  modifier uniqueNonce(uint256 nonce) {
    require(!nonces[nonce], "FSC::Repeated nonce");
    _;
  }

  constructor(address _owner, address _oracleAddress) Ownable(_owner) {
    oracleAddress = _oracleAddress;
    fsVault = new FS_Vault(address(this));
    fsRewards = new FS_Rewards(address(fsVault));
    offerCount++;
  }

  fallback() external payable {}

  receive() external payable {}

  function createOffer(FS_Util.Offer memory offer, FS_Util.Call[] calldata tokenCalldatas, string memory message, uint256 nonce, bytes memory signedMessage) external payable uniqueNonce(nonce) {
    require(msg.value == offer.maker.native + offer.maker.fee, "FSC::Insufficient value");

    verifySignature(message, 0, nonce, signedMessage);
    nonces[nonce] = true;

    offer.id = offerCount;
    offer.maker.sent = true;

    offerCount++;
    offers[offer.id] = offer;

    address[] memory nativeAddresses;
    uint256[] memory nativeValues;

    fsVault.executeCalls{value: offer.maker.native}(nativeAddresses, nativeValues, tokenCalldatas);

    emit CreateOffer(offer.id);
  }

  function acceptOffer(uint256 id, uint256 takerFee, FS_Util.Call[] calldata tokenCalldatas, string memory message, uint256 nonce, bytes memory signedMessage) external payable uniqueNonce(nonce) {
    FS_Util.Offer memory offer = offers[id];

    require(msg.sender != offer.maker.walletAddress, "FSC::Can't accept own offer");
    require(msg.value == offer.taker.native + takerFee, "FSC::Insufficient value");
    require(offer.status == FS_Util.Status.ACTIVE, "FSC::Offer expired");

    verifySignature(message, offer.id, nonce, signedMessage);
    nonces[nonce] = true;

    offer.taker.walletAddress = msg.sender;
    offer.taker.fee = takerFee;
    offer.taker.sent = true;
    offer.status = FS_Util.Status.COMPLETED;

    delete offers[id];

    address[] memory nativeAddresses = new address[](2);
    nativeAddresses[0] = offer.maker.walletAddress;
    nativeAddresses[1] = msg.sender;

    uint256[] memory nativeValues = new uint256[](2);
    nativeValues[0] = offer.taker.native;
    nativeValues[1] = offer.maker.native;

    fsVault.executeCalls{value: offer.taker.native}(nativeAddresses, nativeValues, tokenCalldatas);

    emit AcceptOffer(offer.id, offer.taker.walletAddress, offer.taker.fee);
  }

  function cancelOffer(uint256 id, FS_Util.Call[] calldata tokenCalldatas, string memory message, uint256 nonce, bytes memory signedMessage) external uniqueNonce(nonce) {
    FS_Util.Offer memory offer = offers[id];

    require(msg.sender == offer.maker.walletAddress, "FSC::Not offer maker");
    require(offer.status == FS_Util.Status.ACTIVE, "FSC::Offer expired");

    verifySignature(message, offer.id, nonce, signedMessage);
    nonces[nonce] = true;

    delete offers[id];
    
    address[] memory nativeAddresses = new address[](1);
    nativeAddresses[0] = offer.maker.walletAddress;

    uint256[] memory nativeValues = new uint256[](1);
    nativeValues[0] = offer.maker.native;

    fsVault.executeCalls(nativeAddresses, nativeValues, tokenCalldatas);

    emit CancelOffer(offer.id);
  }

  function craftReward(uint256 id, FS_Util.Call[] calldata tokenCalldatas, string memory message, uint256 nonce, bytes memory signedMessage) external uniqueNonce(nonce) {
    verifySignature(message, 0, nonce, signedMessage);
    nonces[nonce] = true;

    address[] memory nativeAddresses;
    uint256[] memory nativeValues;

    fsVault.executeCalls(nativeAddresses, nativeValues, tokenCalldatas);

    emit CraftReward(id, msg.sender);
  }

  function claimFees() external onlyOwner {
    address owner = owner();
    payable(owner).transfer(address(this).balance);
  }

  function getFsVaultAddress() external view returns (address) {
    return address(fsVault);
  }

  function getFsRewardsAddress() external view returns (address) {
    return address(fsRewards);
  }

  function getOffer(uint256 id) external view returns (FS_Util.Offer memory) {
    return offers[id];
  }

  function verifySignature(string memory message, uint256 offerId, uint256 nonce, bytes memory signedMessage) internal view {
    require(signedMessage.length == 65, "FSC::Invalid signature length");
    require(block.timestamp < (nonce + 3 minutes), "FSC::Expired signature");

    bytes32 messageHash = keccak256(abi.encodePacked(message, offerId, nonce));
    bytes32 signedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    bytes32 r;
    bytes32 s;
    uint8 v;

    assembly {
        r := mload(add(signedMessage, 32))
        s := mload(add(signedMessage, 64))
        v := byte(0, mload(add(signedMessage, 96)))
    }

    require(ecrecover(signedMessageHash, v, r, s) == oracleAddress, "FSC::Unauthorized call");
  }
}