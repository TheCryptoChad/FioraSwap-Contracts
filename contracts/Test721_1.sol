// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Test721_1 is ERC721 {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("Test721_1", "T721_1") {}

    function safeMint(address to) public {
        uint256 tokenId = _tokenIdCounter.current() + 1;
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }
}