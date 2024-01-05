// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract FS_Util {
    enum Status {
        INACTIVE,
        ACTIVE
    }

    struct Participant {
        address walletAddress;
        uint256 fee;
        uint256 native;
        bool sent;
    }

    struct Offer {
        bytes32 id;
        Participant maker;
        Participant taker;
        Status status;
    }

    struct Call {
        address target;
        bytes callData;
    }
}
