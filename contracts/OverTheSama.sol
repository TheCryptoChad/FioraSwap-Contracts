// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

/// @title OverTheSama: A Multi-Asset, Decentralized, Over-The-Counter Trading Protocol.
/// @author Adham Elneser Issa - TheCryptoChad
/// @notice You can use this contract for making multi-asset trades with another user based on your specifications.
contract OverTheSama is ERC721Holder, ERC1155Holder {
    /// @dev Necessary for checking ERC165 interface in checkErcStandard().
    using ERC165Checker for address;
    
    /// @dev Custom type for collecting all information regarding a trade.
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

    /// @notice Array holding every offer created, regardless of status.
    Offer[] public offers;

    /// @notice Variable created to get around limitations of the default public call to "offers".
    uint public offerCount;

    /// @notice Account with privileges to call certain functions.
    address payable owner;

    /// @notice Address to the NFT that will provide discounts in protocol fees and governance rights.
    address public discountNftAddress;

    /// @notice Base fee for non-NFT holders.
    uint public baseProtocolFee;

    /// @dev Fees collected by protocol usage, fully independent from contract's ether balance.
    uint private collectedProtocolFees;

    /// @dev ERC standard determined for addresses passed as parameters in certain fucntions.
    uint private ercStandard;

    /// @notice Determines whether the contract is operational or has migrated to new version.
    bool public contractIsLive;

    /// @dev Inherited interfaces to call ERC methods.
    IERC20 private erc20;
    IERC721 private erc721;
    IERC1155 private erc1155;

    /// @notice Restricts function calling to the owner.
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// @notice Restricts function calling once the contract is shut down.
    modifier liveContract() {
        require(contractIsLive == true, "Contract offline");
        _;
    }

    constructor() {
        owner = payable(msg.sender);
        baseProtocolFee = 0.1 ether;
        collectedProtocolFees = 0 ether;
        offerCount = 0;
        contractIsLive = true;
    }

    /// @notice Creates an offer struct based on specified parameters, and appends it to the offers array.
    /// @dev Token amounts and token ids are nested arrays to account for ERC1155's safeBatchTranferFrom.
    /// @dev Arguments are inserted using dot notation to allow storage manipulation in other functions.
    /// @param _etherAmount2 Amount of ether to be sent by user1 upon accepting the offer.
    /// @param _fee1 Fee to be paid by user1.
    /// @param _tokenAddresses1 Array of the addresses for the tokens user1 will send.
    /// @param _tokenAddresses2 Array of the addresses for the tokens user2 will send.
    /// @param _tokenAmounts1 Array of the amount of each token user1 will send.
    /// @param _tokenAmounts2 Array of the amount of each token user2 will send.
    /// @param _tokenIds1 Array of the ids of each token user1 will send.
    /// @param _tokenIds2 Array of the ids of each token user2 will send.
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
        liveContract 
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

    /// @notice Processes users sending their tokens as part of offer creation and acceptance.
    /// @dev Structure allows for edge cases such as either user only sending ether as their part of the trade.
    /// @param _id Id used to call the appropiate offer from the offers array.
    /// @param _fee2 Fee to be paid user2, used only when user2 calls the function.
    function acceptOffer(uint _id, uint _fee2) public payable liveContract {
        Offer storage offer = getStorageOffers(_id);

        address[] memory tokenAddresses;
        uint[][] memory tokenAmounts;
        uint[][] memory tokenIds;

        if (msg.sender == offer.user1) {
           tokenAddresses = offer.tokenAddresses1;
           tokenAmounts = offer.tokenAmounts1;
           tokenIds = offer.tokenIds1;

        } else {
            require(msg.value >= offer.etherAmount2, "Not enough ETH");
            offer.user2 = payable(msg.sender);
            offer.fee2 = _fee2;
            tokenAddresses = offer.tokenAddresses2;
            tokenAmounts = offer.tokenAmounts2;
            tokenIds = offer.tokenIds2;
        }


        if (tokenAddresses.length > 0) {
            for (uint8 i; i < tokenAddresses.length; i++) {
                ercStandard = checkErcStandard(tokenAddresses[i]);
                
                if (ercStandard == 20) {
                    erc20 = IERC20(tokenAddresses[i]);
                    require(erc20.balanceOf(msg.sender) >= tokenAmounts[i][0], "Not enough ERC20");
                    erc20.transferFrom(msg.sender, address(this), tokenAmounts[i][0]);
                
                } else if (ercStandard == 721) {
                    erc721 = IERC721(tokenAddresses[i]);
                    require(msg.sender == erc721.ownerOf(tokenIds[i][0]), "Not owner of ERC721");
                    erc721.safeTransferFrom(msg.sender, address(this), tokenIds[i][0], "");
                
                } else if (ercStandard == 1155) {
                    erc1155 = IERC1155(tokenAddresses[i]);
                    for (uint8 j; j < offer.tokenIds1[i].length; j++) {
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
            swapAndSendTokens(offer.id);
            offer.status = "completed";

        }
    }

    /// @notice Performs the "swap" by sending the received tokens to the opposite party.
    /// @param _id Id used to call the appropiate offer from the offers array.
    function swapAndSendTokens(uint _id) public payable liveContract {
        Offer memory offer = getMemoryOffers(_id);
        require(offer.sent1 == true, "Missing user1 tokens");
        require(offer.sent2 == true, "Missing user2 tokens");
        require(msg.sender == offer.user2, "Not a participant");
        require(keccak256(abi.encodePacked(offer.status)) == keccak256(abi.encodePacked("active")), "Offer inactive");

        offer.user2.transfer(offer.etherAmount1);

        if (offer.tokenAddresses1.length > 0) {
            for (uint i = 0; i < offer.tokenAddresses1.length; i++) {
                ercStandard = checkErcStandard(offer.tokenAddresses1[i]);
                
                if (ercStandard == 20) {
                    erc20 = IERC20(offer.tokenAddresses1[i]);
                    erc20.transfer(offer.user2, offer.tokenAmounts1[i][0]);
                }

                if (ercStandard == 721) {
                    erc721 = IERC721(offer.tokenAddresses1[i]);
                    erc721.safeTransferFrom(address(this), offer.user2, offer.tokenIds1[i][0], "");
                }

                if (ercStandard == 1155) {
                    erc1155 = IERC1155(offer.tokenAddresses1[i]);
                    erc1155.safeBatchTransferFrom(address(this), offer.user2, offer.tokenIds1[i], offer.tokenAmounts1[i], "");    
                } 
            }
        }

        offer.user1.transfer(offer.etherAmount2);

        if (offer.tokenAddresses2.length > 0) {
            for (uint i = 0; i < offer.tokenAddresses2.length; i++) {
                ercStandard = checkErcStandard(offer.tokenAddresses2[i]);
                
                if (ercStandard == 20) {
                    erc20 = IERC20(offer.tokenAddresses2[i]);
                    erc20.transfer(offer.user1, offer.tokenAmounts2[i][0]);
                }

                if (ercStandard == 721) {
                    erc721 = IERC721(offer.tokenAddresses2[i]);
                    erc721.safeTransferFrom(address(this), offer.user1, offer.tokenIds2[i][0], "");
                }

                if (ercStandard == 1155) {
                    erc1155 = IERC1155(offer.tokenAddresses2[i]);
                    erc1155.safeBatchTransferFrom(address(this), offer.user1, offer.tokenIds2[i], offer.tokenAmounts2[i], "");    
                } 
            }
        }
    }

    /// @notice Allows user1 to cancel their ACTIVE offer and get their tokens back.
    /// @notice User1 will get back their ether and ERCs, but not the protocol fee.
    /// @dev This was necessary due to the escrow nature of the contract.
    /// @param _id Id used to call the appropiate offer from the offers array.
    function cancelOffer(uint _id) public payable liveContract {
        Offer storage offer = getStorageOffers(_id);
        require(msg.sender == offer.user1 || msg.sender == owner, "Not offer creator");
        require(offer.sent1 == true, "Missing user1 tokens");
        require(keccak256(abi.encodePacked(offer.status)) == keccak256(abi.encodePacked("active")), "Offer inactive");
        
        offer.user1.transfer(offer.etherAmount1);

        if (offer.tokenAddresses1.length > 0) {
            for (uint i = 0; i < offer.tokenAddresses1.length; i++) {
                ercStandard = checkErcStandard(offer.tokenAddresses1[i]);
                
                if (ercStandard == 20) {
                    erc20 = IERC20(offer.tokenAddresses1[i]);
                    erc20.transfer(offer.user1, offer.tokenAmounts1[i][0]);
                }

                if (ercStandard == 721) {
                    erc721 = IERC721(offer.tokenAddresses1[i]);
                    erc721.safeTransferFrom(address(this), offer.user1, offer.tokenIds1[i][0], "");
                }

                if (ercStandard == 1155) {
                    erc1155 = IERC1155(offer.tokenAddresses1[i]);
                    erc1155.safeBatchTransferFrom(address(this), offer.user1, offer.tokenIds1[i], offer.tokenAmounts1[i], "");    
                } 
            }
        }
        offer.status = "cancelled";
    }

    /// @notice Allows the owner to retreive the collected protocol fees.
    function retrieveProtocolFees() public payable onlyOwner {
        owner.transfer(collectedProtocolFees);
        collectedProtocolFees = 0;
    }

    /// @notice Allows the owner to "shutdown" the contract when migrating to a new version.
    /// @notice Will cancel every active offer and return funds before shutting down.
    function nukeContract() public onlyOwner {
        for (uint i = 0; i < offers.length; i++) {
            Offer memory offer = getMemoryOffers(i);
            if (keccak256(abi.encodePacked(offer.status)) == keccak256(abi.encodePacked("active"))) {
                cancelOffer(offer.id);
            }     
        }
        
        contractIsLive == false;
    }
    
    /// @notice Allows the owner to set an NFT address to provide holders with discounts in the protocol fee.
    function setDiscountNftAddress(address _discountNftAddress) public onlyOwner {
        discountNftAddress = _discountNftAddress;
    }

    /// @notice Allows the owner to set a new base fee if future governance decides so.
    function setBaseProtocolFee(uint _baseProtocolFee) public onlyOwner {
        baseProtocolFee = _baseProtocolFee;
    }

    /// @notice Utility function to determine ERC standard given an address.
    /// @dev Necessary to call the correct approve and transfer methods in each case.
    /// @param _token Address of the token to be categorized.
    /// @return ercStandard_ The token standard as a uint.
    function checkErcStandard(address _token) public view liveContract returns (uint ercStandard_) {
        if (_token.supportsInterface(0x80ac58cd)) {
            ercStandard_ = 721;

        } else if (_token.supportsInterface(0xd9b67a26)) {
            ercStandard_ = 1155;
        
        } else {
            ercStandard_ = 20; 
        } 
    }

    /// @notice Allows the owner to see the amount of fees collected.
    /// @return collectedProtocolFees_ The current fees available for retreival.
    function getCollectedProtocolFees() public view onlyOwner returns (uint collectedProtocolFees_) {
        collectedProtocolFees_ = collectedProtocolFees;
    }

    /// @notice Returns the offer tied to the specified id.
    /// @dev Necessary because the default get function doesn't return nested arrays in the struct.
    /// @param _id Id used to call the appropiate offer from the offers array.
    /// @return The offer as a read-only variable to save on gas.
    function getMemoryOffers(uint _id) public view liveContract returns (Offer memory) {
        require(_id < offers.length, "Offer does not exist");
        return offers[_id];
    }

    /// @notice Returns the offer tied to the specified id.
    /// @dev Necessary because the default get function doesn't return nested arrays in the struct.
    /// @dev Necessary for instances where values in storage need modifying.
    /// @param _id Id used to call the appropiate offer from the offers array.
    /// @return The offer as a read-write variable.
    function getStorageOffers(uint _id) private view liveContract returns (Offer storage) {
        require(_id < offers.length, "Offer does not exist");
        return offers[_id];
    }
}