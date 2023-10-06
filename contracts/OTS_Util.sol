//SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

contract OTS_Util {
    enum TokenType {
        NATIVE,
        ERC20,
        ERC721,
        ERC1155
    }

    enum OfferStatus {
        ACTIVE,
        COMPLETED,
        CANCELLED
    }

    enum OfferParticipant {
        MAKER,
        TAKER
    }

    struct Offer {
        uint256 id;
        address maker;
        address taker;
        uint256 makerFee;
        uint256 takerFee;
        TokenType[] makerTokenTypes;
        TokenType[] takerTokenTypes;
        address[] makerTokenAddresses;
        address[] takerTokenAddresses;
        uint256[][] makerTokenIds;
        uint256[][] takerTokenIds;
        uint256[][] makerTokenAmounts;
        uint256[][] takerTokenAmounts;
        uint256[] makerTokenChainIds;
        uint256[] takerTokenChainIds;
        bool makerSent;
        bool takerSent;
        OfferStatus status;
    }
}
