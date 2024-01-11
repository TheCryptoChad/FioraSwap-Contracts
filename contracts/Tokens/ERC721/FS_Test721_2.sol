// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract FS_Test721_2 is ERC721 {
    uint256 private _nextTokenId = 1;

    mapping(address => uint256) private _hasMinted;

    constructor() ERC721("FS_Test721_2", "FS_T721_2") {}

    function safeMint(address to) public {
        require(_hasMinted[msg.sender] < 10, "FST::Can't mint more");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _hasMinted[msg.sender] += 1;
    }
}