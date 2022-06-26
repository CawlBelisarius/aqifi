//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";
import "./ChromaticBridge.sol";

contract Prism {

    // address public owner;
    IERC20 public spectral;
    IERC20[] public chromaticTokens; 
    ChromaticBridge[] public chromaticBridges;

    struct Chromatic {
        IERC20 token;
        ChromaticBridge bridge;
        bool prismIsPrior;
    }

    constructor(address spectralAddress, address[] chromaticTokenAddresses, address[] chromaticBridgeAddresses) {
        
        // owner = msg.sender;
        spectral = IERC20(spectralAddress);

        uint8 length = chromaticTokenAddresses.length;
        require(length == chromaticBridgeAddresses.length, "unequal amounts of chromatic tokens and bridges");

        IERC20[length] _chromaticTokens;
        ChromaticBridge[length] _chromaticBridges;

        for (uint i=0; i < length; i++) {
            address tokenAddress = chromaticTokenAddresses[i];
            IERC20 token = IERC20(tokenAddress);
            _chromaticTokens[i] = token;

            address bridgeAddress = chromaticBridgeAddresses[i];
            ChromaticBridge bridge = ChromaticBridge(bridgeAddress);
            _chromaticBridges[i] = bridge;

        }

        chromaticTokens = _chromaticTokens;
        chromaticBridges = _chromaticBridges;
    }

    function splitTo(address receiver) public {
        uint256 amount = spectral.allowance(msg.sender, address(this));
        require(amount > 0, "spectral allowance for prism not larger than zero");

        spectral.transferFrom(msg.sender, address(this), amount);

        for (uint i=0; i < chromaticTokens.length; i++) {
            ChromaticBridge bridge = chromaticBridges[i];
            chromaticTokens[i].approve(amount, bridge);
            bridge.bridgeTo(receiver);
        }
    }

    function combine() public {
        uint256 amount = chromatics[0].allowance(msg.sender, address(this));
        require(amount > 0, "first chromatic allowance for prism not larger than zero");

        for (uint i=1; i < chromatics.length; i++) {
            uint256 amount_i = chromatics[i].allowance(msg.sender, address(this));
            require(amount_i == amount, "unequal chromatic allowances for prism");
        }

        for (uint i=0; i < chromatics.length; i++) {
            chromatics[i].transferFrom(msg.sender, address(this), amount);
        }

        spectral.transfer(msg.sender, amount);
    }
}