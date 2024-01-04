// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Test721_1 is ERC721 {
    uint256 private _nextTokenId = 1;

    constructor() ERC721("Test721_1", "T721_1") {}

    function safeMint(address to) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }
}