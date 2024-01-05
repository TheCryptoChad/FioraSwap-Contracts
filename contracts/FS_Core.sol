// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FS_Vault} from "./FS_Vault.sol";
import {FS_Rewards} from "./FS_Rewards.sol";
import {FS_Util} from "./FS_Util.sol";

contract FS_Core is Ownable {
    FS_Vault private immutable _fsVault;
    FS_Rewards private immutable _fsRewards;
    address private immutable _oracleAddress;

    uint256 private _nonce;

    mapping(bytes32 => FS_Util.Offer) private _offers;
    
    event CreateOffer(bytes32 indexed id);
    event AcceptOffer(bytes32 indexed id, address indexed taker, uint256 indexed takerFee);
    event CancelOffer(bytes32 indexed id);
    event CraftReward(uint256 indexed id, address indexed crafter);

    constructor(address owner_, address oracleAddress_) 
        Ownable(owner_) 
    {
        _fsVault = new FS_Vault(address(this));
        _fsRewards = new FS_Rewards(address(_fsVault));
        _oracleAddress = oracleAddress_;
    }

    receive() external payable {}

    fallback() external payable {}

    function createOffer(
        FS_Util.Offer memory offer_, 
        FS_Util.Call[] calldata tokenCalldatas_, 
        string memory message_, 
        uint256 nonce_, 
        bytes memory signedMessage_
    ) 
        external 
        payable 
    {
        require(msg.value == (offer_.maker.native + offer_.maker.fee), "FSC::Insufficient value");

        _verifySignature(message_, offer_.id, nonce_, signedMessage_);

        _offers[offer_.id] = offer_;

        address[] memory nativeAddresses;
        uint256[] memory nativeValues;

        _fsVault.executeCalls{value: offer_.maker.native}(nativeAddresses, nativeValues, tokenCalldatas_);

        emit CreateOffer(offer_.id);
    }

    function acceptOffer(
        bytes32 id_, 
        uint256 takerFee_, 
        FS_Util.Call[] calldata tokenCalldatas_, 
        string memory message_, 
        uint256 nonce_, 
        bytes memory signedMessage_
    ) 
        external 
        payable
    {
        FS_Util.Offer memory offer = _offers[id_];

        require(offer.status == FS_Util.Status.ACTIVE, "FSC::Offer expired");
        require(msg.sender != offer.maker.walletAddress, "FSC::Can't accept own offer");
        require(msg.value == offer.taker.native + takerFee_, "FSC::Insufficient value");

        _verifySignature(message_, id_, nonce_, signedMessage_);

        delete _offers[id_];

        address[] memory nativeAddresses = new address[](2);
        nativeAddresses[0] = offer.maker.walletAddress;
        nativeAddresses[1] = msg.sender;

        uint256[] memory nativeValues = new uint256[](2);
        nativeValues[0] = offer.taker.native;
        nativeValues[1] = offer.maker.native;

        _fsVault.executeCalls{value: offer.taker.native}(nativeAddresses, nativeValues, tokenCalldatas_);

        emit AcceptOffer(id_, msg.sender, takerFee_);
    }

    function cancelOffer(
        bytes32 id_, 
        FS_Util.Call[] calldata tokenCalldatas_, 
        string memory message_, 
        uint256 nonce_, 
        bytes memory signedMessage_
    ) 
        external
    {
        FS_Util.Offer memory offer = _offers[id_];
        require(offer.status == FS_Util.Status.ACTIVE, "FSC::Offer expired");
        require(msg.sender == offer.maker.walletAddress, "FSC::Not offer maker");

        _verifySignature(message_, id_, nonce_, signedMessage_);

        delete _offers[id_];

        address[] memory nativeAddresses = new address[](1);
        nativeAddresses[0] = offer.maker.walletAddress;

        uint256[] memory nativeValues = new uint256[](1);
        nativeValues[0] = offer.maker.native;

        _fsVault.executeCalls(nativeAddresses, nativeValues, tokenCalldatas_);

        emit CancelOffer(id_);
    }

    function craftReward(
        uint256 id_, 
        FS_Util.Call[] calldata tokenCalldatas_, 
        string memory message_, 
        uint256 nonce_, 
        bytes memory signedMessage_
    ) 
        external
    {
        _verifySignature(message_, 0, nonce_, signedMessage_);

        address[] memory nativeAddresses;
        uint256[] memory nativeValues;

        _fsVault.executeCalls(nativeAddresses, nativeValues, tokenCalldatas_);

        emit CraftReward(id_, msg.sender);
    }

    function claimFees() external onlyOwner {
        address owner = owner();
        payable(owner).transfer(address(this).balance);
    }

    function getFsVaultAddress() external view returns (address) {
        return address(_fsVault);
    }

    function getFsRewardsAddress() external view returns (address) {
        return address(_fsRewards);
    }

    function encodeOffer(
        address maker_,
        address[] memory makerTokenAddresses_,
        uint256[] memory makerTokenNetworks_,
        address[] memory takerTokenAddresses_,
        uint256[] memory takerTokenNetworks_,
        uint256 nonce_,
        bytes32 offerHash_
    ) 
        external 
        pure 
        returns (bool) 
    {
        bytes32 offerHash = keccak256(
            abi.encodePacked(
                maker_,
                makerTokenAddresses_,
                makerTokenNetworks_,
                takerTokenAddresses_,
                takerTokenNetworks_,
                nonce_
            )
        );
        return offerHash == offerHash_;
    }

    function _verifySignature(
        string memory message_, 
        bytes32 id_, 
        uint256 nonce_, 
        bytes memory signedMessage_
    ) 
        internal  
    {
        require(signedMessage_.length == 65, "FSC::Invalid signature length");
        require(_nonce < nonce_, "FSC::Repeated nonce");
        require((block.timestamp * 10) < (nonce_ + 3 minutes), "FSC::Expired signature");

        bytes32 messageHash = keccak256(abi.encodePacked(message_, id_, nonce_));
        bytes32 signedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signedMessage_, 32))
            s := mload(add(signedMessage_, 64))
            v := byte(0, mload(add(signedMessage_, 96)))
        }

        require(ecrecover(signedMessageHash, v, r, s) == _oracleAddress, "FSC::Unauthorized call");
        _nonce = nonce_;
    }
}