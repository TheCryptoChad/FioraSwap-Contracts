// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Test20_2 is ERC20 {
    constructor() ERC20("Test20_2", "T20_2") {
        _mint(msg.sender, 100 * 10 ** decimals());
    }
}