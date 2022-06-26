//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract ChromaticBridge {

    // address public owner;
    IERC20 public prior;
    IERC20 public posterior;

    constructor(address priorAddress, string memory name, string memory ticker, uint256 amount) {
        // owner = msg.sender;
        prior = IERC20(priorAddress);
        posterior = new Token(name, ticker, amount);
    }

    function getPosteriorAddress() public view returns (address) {
        return address(posterior);
    }

    function bridgeTo(address receiver) public {
        uint256 amount = prior.allowance(msg.sender, address(this));
        require(amount > 0, "prior allowance for chromatic bridge not larger than zero");

        prior.transferFrom(msg.sender, address(this), amount);
        posterior.transfer(msg.sender, receiver);
    }

    function unbridgeTo(address receiver) public {
        uint256 amount = posterior.allowance(msg.sender, address(this));
        require(amount > 0, "posterior allowance for chromatic bridge not larger than zero");

        posterior.transferFrom(msg.sender, address(this), amount);
        prior.transfer(receiver, amount);
    }
}