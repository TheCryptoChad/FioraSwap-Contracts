// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "./OTS_Util.sol";

contract OTS_Offer is ERC721Holder, ERC1155Holder {
    OTS_Util.Offer public offer;

    address private otsAdmin;

    constructor(OTS_Util.Offer memory _offer) {
        offer = _offer;
        otsAdmin = msg.sender;
    }

    function acceptOffer(uint256 _takerFee) public payable {
        OTS_Util.Offer memory cachedOffer = offer;
        require(cachedOffer.status == OTS_Util.OfferStatus.ACTIVE);
        require(msg.value >= cachedOffer.takerTokenAmounts[0][0] + _takerFee);

        offer.taker = msg.sender;
        transferTokens(OTS_Util.OfferParticipant.TAKER, msg.sender, cachedOffer.maker);
        transferTokens(OTS_Util.OfferParticipant.MAKER, address(this), msg.sender);
        offer.status = OTS_Util.OfferStatus.COMPLETED;
    } 

    function cancelOffer() public payable {
        OTS_Util.Offer memory cachedOffer = offer;
        require(msg.sender == cachedOffer.maker || msg.sender == otsAdmin);
        transferTokens(OTS_Util.OfferParticipant.MAKER, address(this), cachedOffer.maker);
        offer.status = OTS_Util.OfferStatus.CANCELLED;
    }

    function transferTokens(OTS_Util.OfferParticipant _tokens, address _from, address _to) public payable {
        OTS_Util.Offer memory cachedOffer = offer;
        require(msg.sender == cachedOffer.maker || msg.sender == cachedOffer.taker || msg.sender == otsAdmin);
        OTS_Util.TokenType[] memory tokenTypes;
        address[] memory tokenAddresses;
        uint256[][] memory tokenIds;
        uint256[][] memory tokenAmounts;

        if (_tokens == OTS_Util.OfferParticipant.MAKER) {
            tokenTypes = cachedOffer.makerTokenTypes;
            tokenAddresses = cachedOffer.makerTokenAddresses;
            tokenIds = cachedOffer.makerTokenIds;
            tokenAmounts = cachedOffer.makerTokenAmounts;
        
        } else {
            tokenTypes = cachedOffer.takerTokenTypes;
            tokenAddresses = cachedOffer.takerTokenAddresses;
            tokenIds = cachedOffer.takerTokenIds;
            tokenAmounts = cachedOffer.takerTokenAmounts;
        }

        uint256 length = tokenTypes.length;
        uint256 i;

        while (i < length) {
            if (tokenTypes[i] == OTS_Util.TokenType.NATIVE && _from == address(this)) {
                payable(_to).transfer(tokenAmounts[i][0]);

            } else if (tokenTypes[i] == OTS_Util.TokenType.ERC20) {
                IERC20(tokenAddresses[i]).transferFrom(_from, _to, tokenAmounts[i][0]);

            } else if (tokenTypes[i] == OTS_Util.TokenType.ERC721) {
                IERC721(tokenAddresses[i]).safeTransferFrom(_from, _to, tokenIds[i][0], "");

            } else {
                IERC1155(tokenAddresses[i]).safeBatchTransferFrom(_from, _to, tokenIds[i], tokenAmounts[i], "");
            }

            unchecked{++i;}
        }

        if (_tokens == OTS_Util.OfferParticipant.TAKER) {
            offer.takerSent = true;
        }
    }
}