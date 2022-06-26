//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Aqifi {

    struct PairedToken {
        bool allowSinking;
        bool allowRedemption;
        uint8 price;
        bool invertPrice;
        uint256 maxSunk;
    }

    struct Bond {
        uint256 amount;
        uint256 expirationTS;
    }

    address public owner;
    IERC20 public aqa;
    mapping(address => PairedToken) tokens;
    mapping(address => Bond) bonds;

    event Sunk(uint256 tknSunk, uint256 aqaEmitted);
    event Redeemed(uint256 aqaRedeemed, uint256 tknReturned);

    constructor() {
        aqa = new Token("Aqifi Token", "AQA", 10000);
        owner = msg.sender;
    }

    function getAqaAddress() public view returns (address) {
        return address(aqa);
    }

    function getToken(address tokenAddress) public view returns (PairedToken memory) {
        return tokens[tokenAddress];
    }

    // NOTE using "delete" might apparently be slightly cheaper than setting to 0
    function setToken(address tokenAddress,  bool sinking, bool redemption, uint8 initPrice, bool priceInverted, uint256 max) public {
        require(msg.sender == owner, "not the owner");
        tokens[tokenAddress] = PairedToken({
            allowSinking: sinking,
            allowRedemption: redemption,
            price: initPrice,
            invertPrice: priceInverted,
            maxSunk: max
        });
    }

    function setPrismaticBridge(address prismAddress, uint256 prismBalance, uint256 prismAllowance) public {
        require(msg.sender == owner, "only the owner can add prisms to Aqifi");
        aqa.transfer(prismAddress, prismBalance);
        aqa.approve(prismAddress, prismAllowance);
    }

    function sink(address tokenAddress) public {
        PairedToken memory token = tokens[tokenAddress];
        require(token.allowSinking, "token not open for sinking");

        IERC20 tokenContract = IERC20(tokenAddress);
        uint256 tknSunk = tokenContract.allowance(msg.sender, address(this));
        require(tknSunk > 0, "You need to sink at least some tokens");
        // require(TODO, "Maximum tokens already sunk");

        uint256 aqaEmitted;
        if (token.invertPrice) {
            aqaEmitted = tknSunk * token.price;
        } else {
            aqaEmitted = tknSunk / token.price;
        }

        uint256 aqaBalance = aqa.balanceOf(address(this));
        require(aqaEmitted <= aqaBalance, "AQA treasury balance too low");

        tokenContract.transferFrom(msg.sender, address(this), tknSunk);
        aqa.transfer(msg.sender, aqaEmitted);

        emit Sunk(tknSunk, aqaEmitted);
    }

    function redeem(address tokenAddress) public {
        PairedToken memory token = tokens[tokenAddress];
        require(token.allowRedemption, "token not open for redemption");

        uint256 aqaRedeemed = aqa.allowance(msg.sender, address(this));
        require(aqaRedeemed > 0, "You need to redeem at least some AQA");

        uint256 tknReturned;
        if (token.invertPrice) {
            tknReturned = aqaRedeemed / token.price;
        } else {
            tknReturned = aqaRedeemed * token.price;
        }

        IERC20 tokenContract = IERC20(tokenAddress);
        tokenContract.transfer(msg.sender, tknReturned);
        aqa.transferFrom(msg.sender, address(this), aqaRedeemed);

        emit Redeemed(aqaRedeemed, tknReturned);
    }

    function bond() public {
        uint256 aqaBonded = aqa.allowance(msg.sender, address(this));
        require(aqaBonded > 0, "You need to bond at least some AQA"); 
        require(bonds[msg.sender].amount == 0, "You are already bonded"); 

        aqa.transferFrom(msg.sender, address(this), aqaBonded);
        bonds[msg.sender] = Bond({
            amount: aqaBonded,
            expirationTS: block.timestamp + 1 minutes
        });
    }

    function redeemBond() public {
        Bond memory redeemedBond = bonds[msg.sender];
        require(redeemedBond.amount > 0, "You are not bonded"); 
        require(redeemedBond.expirationTS <= block.timestamp, "Bond has not expired yet"); 

        uint256 aqaBalance = aqa.balanceOf(address(this));
        uint256 aqaEmitted = (redeemedBond.amount * 11) / 10;

        require(aqaEmitted <= aqaBalance, "AQA treasury balance too low");

        delete bonds[msg.sender];
        aqa.transfer(msg.sender, aqaEmitted);
    }

    function abortBond() public {
        Bond memory abortedBond = bonds[msg.sender];
        require(abortedBond.amount > 0, "You are not bonded"); 
        require(abortedBond.expirationTS > block.timestamp, "Bond has expired and can be redeemed normally"); 

        uint256 aqaBalance = aqa.balanceOf(address(this));
        uint256 aqaEmitted = (abortedBond.amount * 9) / 10;

        require(aqaEmitted <= aqaBalance, "AQA treasury balance too low");

        delete bonds[msg.sender];
        aqa.transfer(msg.sender, aqaEmitted);
    }

}
