// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "./FS_Admin.sol";
import "./FS_Util.sol";

contract FS_Offer is ERC721Holder, ERC1155Holder {
    FS_Util.Offer public offer;
    address private fsAdmin;

    modifier activeOffer {
        require(offer.status == FS_Util.OfferStatus.ACTIVE);
        _;
    }

    constructor(FS_Util.Offer memory _offer, address _fsAdmin) payable {
        offer = _offer;
        fsAdmin = _fsAdmin;
        transferTokens(_offer, FS_Util.OfferParticipant.MAKER, _offer.maker, address(this));
    }

    function acceptOffer(uint256 _takerFee) public payable activeOffer {
        require(msg.value >= offer.takerTokenAmounts[0][0] + _takerFee);
        offer.taker = msg.sender;
        offer.takerFee = _takerFee;
        FS_Util.Offer memory cachedOffer = offer;
        transferTokens(cachedOffer, FS_Util.OfferParticipant.TAKER, msg.sender, cachedOffer.maker);
        transferTokens(cachedOffer, FS_Util.OfferParticipant.MAKER, address(this), msg.sender);
        offer.status = FS_Util.OfferStatus.COMPLETED;
        FS_Admin(fsAdmin).acceptOffer{value: _takerFee}(cachedOffer.id, msg.sender, _takerFee);
    } 

    function cancelOffer() public activeOffer {
        FS_Util.Offer memory cachedOffer = offer;
        require(msg.sender == cachedOffer.maker || msg.sender == fsAdmin);
        transferTokens(cachedOffer, FS_Util.OfferParticipant.MAKER, address(this), cachedOffer.maker);
        offer.status = FS_Util.OfferStatus.CANCELLED;
        FS_Admin(fsAdmin).cancelOffer(cachedOffer.id);
    }

    function transferTokens(FS_Util.Offer memory _cachedOffer, FS_Util.OfferParticipant _tokens, address _from, address _to) internal {
        require(msg.sender == _cachedOffer.maker || msg.sender == _cachedOffer.taker || msg.sender == fsAdmin || _cachedOffer.id == 0);
        FS_Util.TokenType[] memory tokenTypes;
        address[] memory tokenAddresses;
        uint256[][] memory tokenIds;
        uint256[][] memory tokenAmounts;

        if (_tokens == FS_Util.OfferParticipant.MAKER) {
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
            if (tokenTypes[i] == FS_Util.TokenType.NATIVE && _from != _cachedOffer.maker) {
                payable(_to).transfer(tokenAmounts[i][0]);

            } else if (tokenTypes[i] == FS_Util.TokenType.ERC20) {
                if(_from == address(this)) {
                    IERC20(tokenAddresses[i]).transfer(_to, tokenAmounts[i][0]);
                } else {
                    IERC20(tokenAddresses[i]).transferFrom(_from, _to, tokenAmounts[i][0]);
                }
            } else if (tokenTypes[i] == FS_Util.TokenType.ERC721) {
                IERC721(tokenAddresses[i]).safeTransferFrom(_from, _to, tokenIds[i][0], "");

            } else if (tokenTypes[i] == FS_Util.TokenType.ERC1155) {
                IERC1155(tokenAddresses[i]).safeBatchTransferFrom(_from, _to, tokenIds[i], tokenAmounts[i], "");
            }

            unchecked{++i;}
        }

        if (_tokens == FS_Util.OfferParticipant.TAKER) {
            offer.takerSent = true;
        }
    }
}