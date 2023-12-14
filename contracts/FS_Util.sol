// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract FS_Util {
    enum Standard {
        ERC20,
        ERC721,
        ERC1155
    }

    enum Status {
        ACTIVE,
        COMPLETED,
        CANCELLED
    }

    struct Token {
        Standard standard;
        address contractAddress;
        uint256[] ids;
        uint256[] amounts;
        uint256 chainId;
    }

    struct Participant {
        address walletAddress;
        uint256 fee;
        uint256 eth;
        //Token[] tokens;
        bool sent;
    }

    struct Offer {
        uint256 id;
        Participant maker;
        Participant taker;
        Status status;
    }

    struct Call {
        address target;
        bytes callData;
    }
}
