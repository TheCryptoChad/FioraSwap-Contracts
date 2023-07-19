// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Test20_1 is ERC20 {
    constructor() ERC20("Test20_1", "T20_1") {
        _mint(msg.sender, 100 * 10 ** decimals());
    }
}