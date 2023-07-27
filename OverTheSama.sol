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
        bool sent1;
        bool sent2;
        string status;
    }

    Offer[] public offers;

    uint public offerCount;

    uint public baseProtocolFee;

    uint public collectedProtocolFees;

    constructor() {
        baseProtocolFee = 0.1 ether;
    }

    function createOffer(
        uint _etherAmount2,
        uint _fee1,
        address[] memory _tokenAddresses1,
        address[] memory _tokenAddresses2,
        uint[][] memory _tokenAmounts1,
        uint[][] memory _tokenAmounts2,
        uint[][] memory _tokenIds1,
        uint[][] memory _tokenIds2
    ) 
        public
        payable 
    {
        uint _etherAmount1 = msg.value - _fee1;
        Offer storage newOffer = offers.push();
        newOffer.id = offers.length - 1;
        newOffer.user1 = payable(msg.sender);
        newOffer.user2 = payable(address(0));
        newOffer.etherAmount1 = _etherAmount1;
        newOffer.etherAmount2 = _etherAmount2;
        newOffer.fee1 = _fee1;
        newOffer.fee2 = baseProtocolFee;
        newOffer.tokenAddresses1 = _tokenAddresses1;
        newOffer.tokenAddresses2 = _tokenAddresses2;
        newOffer.tokenAmounts1 = _tokenAmounts1;
        newOffer.tokenAmounts2 = _tokenAmounts2;
        newOffer.tokenIds1 = _tokenIds1;
        newOffer.tokenIds2 = _tokenIds2;
        newOffer.sent1 = false;
        newOffer.sent2 = false;
        newOffer.status = "active";
        acceptOffer(newOffer.id, newOffer.fee1);
        offerCount++;
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
            require(msg.value >= offer.etherAmount2 + _fee2, "Not enough ETH");
            offer.user2 = payable(msg.sender);
            offer.fee2 = _fee2;
            tokenAddresses = offer.tokenAddresses2;
            tokenAmounts = offer.tokenAmounts2;
            tokenIds = offer.tokenIds2;
        }


        if (tokenAddresses.length > 0) {
            for (uint8 i; i < tokenAddresses.length; i++) {
                uint16 ercStandard = checkErcStandard(tokenAddresses[i]);
                
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
                    for (uint8 j; j < tokenIds[i].length; j++) {
                        require(erc1155.balanceOf(msg.sender, tokenIds[i][j]) >= tokenAmounts[i][j], "Not enough ERC1155");
                    }
                    erc1155.safeBatchTransferFrom(msg.sender, address(this), tokenIds[i], tokenAmounts[i], "");    
                }  
            }
        }

        if (msg.sender == offer.user1) {
            collectedProtocolFees += offer.fee1;
            offer.sent1 = true;   

        } else {
            collectedProtocolFees += offer.fee2;
            offer.sent2 = true;
            swapAndSendTokens(offer.id, 1);
            swapAndSendTokens(offer.id, 2);
            offer.status = "completed";

        }
    }

    function swapAndSendTokens(uint _id, uint8 _user) public payable {
        Offer memory offer = getMemoryOffers(_id);
        require(offer.sent1 == true, "Missing user1 tokens");
        require(offer.sent2 == true, "Missing user2 tokens");
        require(msg.sender == offer.user2, "Not a participant");
        require(keccak256(abi.encodePacked(offer.status)) == keccak256(abi.encodePacked("active")), "Offer inactive");

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

        if (tokenAddresses.length > 0) {
            for (uint8 i; i < tokenAddresses.length; i++) {
                uint16 ercStandard = checkErcStandard(tokenAddresses[i]);
                
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
            }
        }
    }

    function cancelOffer(uint _id) public payable {
        Offer storage offer = getStorageOffers(_id);
        require(msg.sender == offer.user1 || msg.sender == owner(), "Not offer creator");
        require(offer.sent1 == true, "Missing user1 tokens");
        require(keccak256(abi.encodePacked(offer.status)) == keccak256(abi.encodePacked("active")), "Offer inactive");
        
        offer.user1.transfer(offer.etherAmount1);

        if (offer.tokenAddresses1.length > 0) {
            for (uint8 i; i < offer.tokenAddresses1.length; i++) {
                uint16 ercStandard = checkErcStandard(offer.tokenAddresses1[i]);
                
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
            }
        }
        offer.status = "cancelled";
    }

    function retrieveProtocolFees() public payable onlyOwner {
        payable(msg.sender).transfer(collectedProtocolFees);
        collectedProtocolFees = 0;
    }

    function batchCancelOffers(uint _startingOffer, uint _endingOffer) public onlyOwner {
        for (uint i = _startingOffer; i < _endingOffer; i++) {
            Offer memory offer = getMemoryOffers(i);
            if (keccak256(abi.encodePacked(offer.status)) == keccak256(abi.encodePacked("active"))) {
                cancelOffer(offer.id);
            }     
        }
    }

    function setBaseProtocolFee(uint _baseProtocolFee) public onlyOwner {
        baseProtocolFee = _baseProtocolFee;
    }

    function checkErcStandard(address _token) public view returns (uint16 ercStandard_) {
        if (_token.supportsInterface(0x80ac58cd)) {
            ercStandard_ = 721;

        } else if (_token.supportsInterface(0xd9b67a26)) {
            ercStandard_ = 1155;
        
        } else {
            ercStandard_ = 20; 
        } 
    }

    function getMemoryOffers(uint _id) public view returns (Offer memory) {
        require(_id < offers.length, "Offer does not exist");
        return offers[_id];
    }

    function getStorageOffers(uint _id) private view returns (Offer storage) {
        require(_id < offers.length, "Offer does not exist");
        return offers[_id];
    }
}