// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Test20_1 is ERC20 {
    mapping(address => uint256) private _hasMinted;

    constructor() ERC20("Test20_1", "T20_1") {}

    function mint(address to, uint256 amount) public {
        require(_hasMinted[msg.sender] < 3, "FST::Can't mint more");
        _mint(to, amount);
        _hasMinted[msg.sender] += 1;
    }
}