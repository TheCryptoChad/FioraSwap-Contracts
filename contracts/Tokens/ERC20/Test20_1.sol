// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Test20_1 is ERC20 {
    constructor() ERC20("Test20_1", "T20_1") {
        _mint(msg.sender, 80 * 10 ** decimals());
    }
}

// pragma solidity ^0.8.20;

// import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// contract Test20_1 is ERC20 {
//     constructor() ERC20("Test20_1", "T20_1") {}

//     function mint(address to, uint256 amount) public {
//         _mint(to, amount);
//     }
// }