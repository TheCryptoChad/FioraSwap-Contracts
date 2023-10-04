// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/AccessControlDefaultAdminRules.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./OTS_Offer.sol";
import "./OTS_Util.sol";

contract OTS_Admin is AccessControlDefaultAdminRules {
    mapping (uint256 => address) private offers;
    address private offerTemplate;
    address private otsOracle;
    uint256 private offerCount = 1;
    uint256 private collectedFees;

    event CreateOffer(uint256 indexed id);
    event AcceptOffer(uint256 indexed id, address indexed taker, uint256 takerFee);
    event CancelOffer(uint256 indexed id);

    modifier isOffer(uint256 _id) {
        require(offers[_id] == msg.sender);
        _;
    }

    constructor(address _offerTemplate, address _otsOracle) AccessControlDefaultAdminRules(15 days, msg.sender) {
        offerTemplate = _offerTemplate;
        otsOracle = _otsOracle;
    }

    function createOffer(OTS_Util.Offer memory _offer, address _predictedAddress, bytes32 _message, bytes memory _signature) public payable {
        require(msg.value >= _offer.makerTokenAmounts[0][0] + _offer.makerFee);
        require(otsOracle == ECDSA.recover(ECDSA.toEthSignedMessageHash(_message), _signature));
        uint256 cachedOfferCount = offerCount;
        _offer.id = cachedOfferCount;
        address offerAddress = deployOfferContract(_offer);
        require(offerAddress == _predictedAddress);
        offers[cachedOfferCount] = offerAddress;
        unchecked{++offerCount;}
        emit CreateOffer(cachedOfferCount);
    } 

    function deployOfferContract(OTS_Util.Offer memory _offer) internal returns (address) {
        bytes32 salt = keccak256(abi.encode(_offer));
        bytes memory bytecode = abi.encodePacked(type(OTS_Offer).creationCode, abi.encode(_offer, address(this), otsOracle));
        return Create2.deploy(_offer.makerTokenAmounts[0][0], salt, bytecode);
    }

    function acceptOffer(uint256 _id, address _taker, uint256 _takerFee) external isOffer(_id) {
        emit AcceptOffer(_id, _taker, _takerFee);
    }

    function cancelOffer(uint256 _id) external isOffer(_id) {
        emit CancelOffer(_id);
    }

    function getOfferAddress(uint256 _id) public view returns (address) {
        return offers[_id];
    }

    function getOfferTemplate() external view returns (address) {
        return offerTemplate;
    }

    function getCollectedFees() external view onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        require(msg.sender == owner());
        return collectedFees;
    }

    function collectFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(owner()).transfer(collectedFees);
        collectedFees = 0;
    }

    function predictOfferAddress(OTS_Util.Offer memory _offer) external view returns (address) {
        bytes32 salt = keccak256(abi.encode(_offer));
        bytes32 bytecodeHash = keccak256(abi.encodePacked(type(OTS_Offer).creationCode, abi.encode(_offer, address(this))));
        return Create2.computeAddress(salt, bytecodeHash);
    }

    function batchCancelOffers(uint256 _startId, uint256 _endId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        do {
            OTS_Offer(offers[_startId]).cancelOffer();
            unchecked{++_startId;}
        } while(_startId <= _endId);
    }

    function beginDefaultAdminTransfer(address newAdmin) public override onlyRole(DEFAULT_ADMIN_ROLE) {
        _beginDefaultAdminTransfer(newAdmin);
    }

    function cancelDefaultAdminTransfer() public override onlyRole(DEFAULT_ADMIN_ROLE) {
        _cancelDefaultAdminTransfer();
    }

    function acceptDefaultAdminTransfer() public override {
        (address newDefaultAdmin, ) = pendingDefaultAdmin();
        require(_msgSender() == newDefaultAdmin, "AccessControl: pending admin must accept");
        _acceptDefaultAdminTransfer();
    }
}