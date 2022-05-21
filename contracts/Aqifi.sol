//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Aqifi {

    IERC20 public aqa;
    IERC20 public tkn;
    uint256 public price;
    address public owner;

    event Sunk(uint256 tknSunk, uint256 aqaEmitted);
    event Redeemed(uint256 aqaRedeemed, uint256 tknReturned);

    constructor(address firstOtherTokenAddress) {
        aqa = new Token("Aqifi Token", "AQA", 10000);
        tkn = IERC20(firstOtherTokenAddress);
        price = 1;
        owner = msg.sender;
    }

    function getAqaAddress() public view returns (address) {
        return address(aqa);
    }

    function setPrice(uint256 newPrice) public {
        require(msg.sender == owner, "not the owner");
        price = newPrice;
    }

    function sink() public {
        uint256 tknSunk = tkn.allowance(msg.sender, address(this));
        require(tknSunk > 0, "You need to sink at least some TKN");

        uint256 aqaEmitted = tknSunk / price;

        uint256 aqaBalance = aqa.balanceOf(address(this));
        require(aqaEmitted <= aqaBalance, "AQA treasury balance too low");

        tkn.transferFrom(msg.sender, address(this), tknSunk);
        aqa.transfer(msg.sender, aqaEmitted);

        emit Sunk(tknSunk, aqaEmitted);
    }

    function redeem() public {
        uint256 aqaRedeemed = aqa.allowance(msg.sender, address(this));
        require(aqaRedeemed > 0, "You need to redeem at least some AQA");

        uint256 tknReturned = aqaRedeemed * price;

        tkn.transfer(msg.sender, tknReturned);
        aqa.transferFrom(msg.sender, address(this), aqaRedeemed);

        emit Redeemed(aqaRedeemed, tknReturned);
    }

}
