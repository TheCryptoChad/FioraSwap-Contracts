// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

contract OverTheSama is ERC721Holder, ERC1155Holder, Ownable {
    using ERC165Checker for address;

    struct Offer {
        uint id;
        address payable user1;
        address payable user2;
        uint etherAmount1;
        uint etherAmount2;
        uint fee1;
        uint fee2;
        address[] tokenAddresses1;
        address[] tokenAddresses2;
        uint[][] tokenAmounts1;
        uint[][] tokenAmounts2;
        uint[][] tokenIds1;
        uint[][] tokenIds2;
        uint sent1;
        uint sent2;
        uint status;
    }

    mapping(uint => Offer) public offers;

    uint public offerCount;

    uint public baseProtocolFee;

    uint public collectedProtocolFees;

    event OfferCreated(uint indexed id);

    event OfferAccepted(uint indexed id, address indexed user2, uint indexed fee2);

    event OfferCancelled(uint indexed id);

    constructor() {
        baseProtocolFee = 0.1 ether;
    }

    function createOffer(
        uint _etherAmount2,
        uint _fee1,
        address[] calldata _tokenAddresses1,
        address[] calldata _tokenAddresses2,
        uint[][] memory _tokenAmounts1,
        uint[][] memory _tokenAmounts2,
        uint[][] memory _tokenIds1,
        uint[][] memory _tokenIds2
    ) 
        public
        payable 
    {
        uint _offerCount = offerCount;
        uint _etherAmount1 = msg.value - _fee1;
        offers[_offerCount] = Offer(_offerCount, payable(msg.sender), payable(address(0)), _etherAmount1, _etherAmount2, _fee1, 0, _tokenAddresses1, _tokenAddresses2, _tokenAmounts1, _tokenAmounts2, _tokenIds1, _tokenIds2, 1, 1, 1);
        acceptOffer(_offerCount, _fee1);
        ++offerCount;
        emit OfferCreated(_offerCount);
    }

    function acceptOffer(uint _id, uint _fee2) public payable {
        Offer storage offer = getStorageOffers(_id);

        address[] memory tokenAddresses;
        uint[][] memory tokenAmounts;
        uint[][] memory tokenIds;

        if (msg.sender == offer.user1) {
           tokenAddresses = offer.tokenAddresses1;
           tokenAmounts = offer.tokenAmounts1;
           tokenIds = offer.tokenIds1;

        } else {
            require(msg.value == offer.etherAmount2 + _fee2, "Not enough ETH");
            offer.user2 = payable(msg.sender);
            offer.fee2 = _fee2;
            tokenAddresses = offer.tokenAddresses2;
            tokenAmounts = offer.tokenAmounts2;
            tokenIds = offer.tokenIds2;
        }

        uint length = tokenAddresses.length;

        if (length != 0) {
            uint i;
            do {
                uint ercStandard = checkErcStandard(tokenAddresses[i]);
                
                if (ercStandard == 20) {
                    IERC20 erc20 = IERC20(tokenAddresses[i]);
                    require(erc20.balanceOf(msg.sender) >= tokenAmounts[i][0], "Not enough ERC20");
                    erc20.transferFrom(msg.sender, address(this), tokenAmounts[i][0]);
                
                } else if (ercStandard == 721) {
                    IERC721 erc721 = IERC721(tokenAddresses[i]);
                    require(msg.sender == erc721.ownerOf(tokenIds[i][0]), "Not owner of ERC721");
                    erc721.safeTransferFrom(msg.sender, address(this), tokenIds[i][0], "");
                
                } else if (ercStandard == 1155) {
                    IERC1155 erc1155 = IERC1155(tokenAddresses[i]);
                    uint j;
                    uint idsLength = tokenIds[i].length;
                    do {
                        require(erc1155.balanceOf(msg.sender, tokenIds[i][j]) >= tokenAmounts[i][j], "Not enough ERC1155");
                        unchecked {++j;}
                    } while (j < idsLength);
                    erc1155.safeBatchTransferFrom(msg.sender, address(this), tokenIds[i], tokenAmounts[i], "");    
                } 
                unchecked {++i;} 
            } while (i < length);
        }

        if (msg.sender == offer.user1) {
            unchecked {collectedProtocolFees += offer.fee1;}
            offer.sent1 = 2;   

        } else {
            unchecked {collectedProtocolFees += offer.fee2;}
            offer.sent2 = 2;
            swapAndSendTokens(offer.id, 1);
            swapAndSendTokens(offer.id, 2);
            offer.status = 2;
            emit OfferAccepted(_id, msg.sender, _fee2);

        }
    }

    function swapAndSendTokens(uint _id, uint _user) public payable {
        Offer memory offer = getMemoryOffers(_id);
        require(msg.sender == offer.user2, "Not a participant");
        require(offer.status == 1, "Inactive offer");

        address payable receiver;
        uint etherAmount;
        address[] memory tokenAddresses;
        uint[][] memory tokenAmounts;
        uint[][] memory tokenIds;

        if (_user == 1) {
            receiver = offer.user2;
            etherAmount = offer.etherAmount1;
            tokenAddresses = offer.tokenAddresses1;
            tokenAmounts = offer.tokenAmounts1;
            tokenIds = offer.tokenIds1;

        } else {
            receiver = offer.user1;
            etherAmount = offer.etherAmount2;
            tokenAddresses = offer.tokenAddresses2;
            tokenAmounts = offer.tokenAmounts2;
            tokenIds = offer.tokenIds2;
        }

        receiver.transfer(etherAmount);

        uint length = tokenAddresses.length;

        if (length != 0) {
            uint i;
            do {
                uint ercStandard = checkErcStandard(tokenAddresses[i]);
                if (ercStandard == 20) {
                    IERC20 erc20 = IERC20(tokenAddresses[i]);
                    erc20.transfer(receiver, tokenAmounts[i][0]);

                } else if (ercStandard == 721) {
                    IERC721 erc721 = IERC721(tokenAddresses[i]);
                    erc721.safeTransferFrom(address(this), receiver, tokenIds[i][0], "");

                } else if (ercStandard == 1155) {
                    IERC1155 erc1155 = IERC1155(tokenAddresses[i]);
                    erc1155.safeBatchTransferFrom(address(this), receiver, tokenIds[i], tokenAmounts[i], "");    
                } 
                unchecked {++i;}
            } while (i < length);
        }
    }

    function cancelOffer(uint _id) public payable {
        Offer storage offer = getStorageOffers(_id);
        require(msg.sender == offer.user1 || msg.sender == owner(), "Not offer creator");
        require(offer.status == 1, "Offer inactive");
        
        offer.user1.transfer(offer.etherAmount1);

        uint length = offer.tokenAddresses1.length;

        if (length != 0) {
            uint i;
            do {
                uint ercStandard = checkErcStandard(offer.tokenAddresses1[i]);
                
                if (ercStandard == 20) {
                    IERC20 erc20 = IERC20(offer.tokenAddresses1[i]);
                    erc20.transfer(offer.user1, offer.tokenAmounts1[i][0]);

                } else if (ercStandard == 721) {
                    IERC721 erc721 = IERC721(offer.tokenAddresses1[i]);
                    erc721.safeTransferFrom(address(this), offer.user1, offer.tokenIds1[i][0], "");

                } else if (ercStandard == 1155) {
                    IERC1155 erc1155 = IERC1155(offer.tokenAddresses1[i]);
                    erc1155.safeBatchTransferFrom(address(this), offer.user1, offer.tokenIds1[i], offer.tokenAmounts1[i], "");    
                } 
                unchecked {++i;}
            } while (i < length);
        }
        offer.status = 3;
        emit OfferCancelled(_id);
    }

    function retrieveProtocolFees() public payable onlyOwner {
        payable(msg.sender).transfer(collectedProtocolFees);
        collectedProtocolFees = 0;
    }

    function batchCancelOffers(uint _startingOffer, uint _endingOffer) public payable onlyOwner {
        do {
            Offer memory offer = getMemoryOffers(_startingOffer);
            if (offer.status == 1) {
                cancelOffer(offer.id);
            }
            unchecked {++_startingOffer;}
        } while (_startingOffer < _endingOffer);
    }

    function setBaseProtocolFee(uint _baseProtocolFee) public payable onlyOwner {
        baseProtocolFee = _baseProtocolFee;
    }

    function checkErcStandard(address _token) public view returns (uint) {
        if (_token.supportsInterface(0x80ac58cd)) {
            return 721;

        } else if (_token.supportsInterface(0xd9b67a26)) {
            return 1155;
        
        } else {
            return 20; 
        } 
    }

    function getMemoryOffers(uint _id) public view returns (Offer memory) {
        return offers[_id];
    }

    function getStorageOffers(uint _id) private view returns (Offer storage) {
        return offers[_id];
    }
}