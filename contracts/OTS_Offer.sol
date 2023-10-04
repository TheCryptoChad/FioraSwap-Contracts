// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./OTS_Admin.sol";
import "./OTS_Util.sol";
import "hardhat/console.sol";

contract OTS_Offer is ERC721Holder, ERC1155Holder {
    OTS_Util.Offer public offer;
    address private otsAdmin;
    address private otsOracle;

    modifier activeOffer {
        require(offer.status == OTS_Util.OfferStatus.ACTIVE);
        _;
    }

    constructor(OTS_Util.Offer memory _offer, address _otsAdmin, address _otsOracle) payable {
        offer = _offer;
        otsAdmin = _otsAdmin;
        otsOracle = _otsOracle;
        transferTokens(_offer, OTS_Util.OfferParticipant.MAKER, _offer.maker, address(this));
    }

    function acceptOffer(uint256 _takerFee, bytes memory _message, bytes memory _signature) public payable activeOffer {
        require(msg.value >= offer.takerTokenAmounts[0][0] + _takerFee);
        require(otsOracle == ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(_message)), _signature));
        offer.taker = msg.sender;
        offer.takerFee = _takerFee;
        OTS_Util.Offer memory cachedOffer = offer;
        transferTokens(cachedOffer, OTS_Util.OfferParticipant.TAKER, msg.sender, cachedOffer.maker);
        transferTokens(cachedOffer, OTS_Util.OfferParticipant.MAKER, address(this), msg.sender);
        offer.status = OTS_Util.OfferStatus.COMPLETED;
        OTS_Admin(otsAdmin).acceptOffer(cachedOffer.id, msg.sender, _takerFee);
    } 

    function cancelOffer() public activeOffer {
        OTS_Util.Offer memory cachedOffer = offer;
        require(msg.sender == cachedOffer.maker);
        transferTokens(cachedOffer, OTS_Util.OfferParticipant.MAKER, address(this), cachedOffer.maker);
        offer.status = OTS_Util.OfferStatus.CANCELLED;
        OTS_Admin(otsAdmin).cancelOffer(cachedOffer.id);
    }

    function transferTokens(OTS_Util.Offer memory _cachedOffer, OTS_Util.OfferParticipant _tokens, address _from, address _to) internal {
        require(msg.sender == _cachedOffer.maker || msg.sender == _cachedOffer.taker || msg.sender == otsAdmin || _cachedOffer.id == 0);
        OTS_Util.TokenType[] memory tokenTypes;
        address[] memory tokenAddresses;
        uint256[][] memory tokenIds;
        uint256[][] memory tokenAmounts;

        if (_tokens == OTS_Util.OfferParticipant.MAKER) {
            tokenTypes = _cachedOffer.makerTokenTypes;
            tokenAddresses = _cachedOffer.makerTokenAddresses;
            tokenIds = _cachedOffer.makerTokenIds;
            tokenAmounts = _cachedOffer.makerTokenAmounts;
        
        } else {
            tokenTypes = _cachedOffer.takerTokenTypes;
            tokenAddresses = _cachedOffer.takerTokenAddresses;
            tokenIds = _cachedOffer.takerTokenIds;
            tokenAmounts = _cachedOffer.takerTokenAmounts;
        }

        uint256 length = tokenTypes.length;
        uint256 i;

        while (i < length) {
            if (tokenTypes[i] == OTS_Util.TokenType.NATIVE && _from != _cachedOffer.maker) {
                payable(_to).transfer(tokenAmounts[i][0]);

            } else if (tokenTypes[i] == OTS_Util.TokenType.ERC20) {
                if(_from == address(this)) {
                    IERC20(tokenAddresses[i]).transfer(_to, tokenAmounts[i][0]);
                } else {
                    IERC20(tokenAddresses[i]).transferFrom(_from, _to, tokenAmounts[i][0]);
                }
            } else if (tokenTypes[i] == OTS_Util.TokenType.ERC721) {
                IERC721(tokenAddresses[i]).safeTransferFrom(_from, _to, tokenIds[i][0], "");

            } else if (tokenTypes[i] == OTS_Util.TokenType.ERC1155) {
                IERC1155(tokenAddresses[i]).safeBatchTransferFrom(_from, _to, tokenIds[i], tokenAmounts[i], "");
            }

            unchecked{++i;}
        }

        if (_tokens == OTS_Util.OfferParticipant.TAKER) {
            offer.takerSent = true;
        }
    }
}