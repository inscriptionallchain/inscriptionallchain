// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/utils/math/SafeMath.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/access/Ownable.sol";
import "../ISwapRouter.sol";
import "../ISwapFactory.sol";
import "../IPancakePair.sol";

contract Token is ERC20,Ownable{
    
    using SafeMath for uint256;
    
    address public fundAddr=0xe048722762Bf7763D4c816De570Db04B6D42988e;

    address public holder=0xEA8f889C4fE7bc8e1ca881FF0A044A0FAF5E7047;

    address public pair;

    uint256 public opentTime;

    uint256 public time1=4 hours;
    uint256 public time2=8 hours;
    uint256 public time3=24 hours;
    uint256 public buyRate=5;
    uint256 public sellRate=2;
    uint256 public sellRate1=30;
    uint256 public sellRate2=15;
    uint256 public sellRate3=7;

    mapping(address => bool) private whiteList;
    
    function setOpen()public onlyOwner{
        opentTime=block.timestamp;
    }
    function setWhite(address _addr,bool b)public onlyOwner{
        whiteList[_addr]=b;
    }
    
    function setTimes(uint256 _time1,uint256 _time2,uint256 _time3)public onlyOwner{
        time1=_time1;
        time2=_time2;
        time3=_time3;
    }
    function setRate(uint256 _buyRate,uint256 _sellRate,uint256 _sellRate1,uint256 _sellRate2,uint256 _sellRate3)public onlyOwner{
        buyRate=_buyRate;
        sellRate=_sellRate;
        sellRate1=_sellRate1;
        sellRate2=_sellRate2;
        sellRate3=_sellRate3;
    }

    constructor() ERC20("DUCK INU", "DUCK"){
        //fundAddr=msg.sender;
        _mint(holder, 100000000000000 * 10 ** decimals());
        whiteList[holder] = true;
        whiteList[address(this)] = true;
        address swap=0x60aE616a2155Ee3d9A68541Ba4544862310933d4;//avax
        address otherToken=0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;//avax WETH
        //address swap=0xD99D1c33F9fC3444f8101754aBC46c52416550D1;//bsc test
        //address otherToken=0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd;//bsc test WETH
        ISwapRouter uniswapV2Router = ISwapRouter(swap);
        pair = ISwapFactory(uniswapV2Router.factory()).createPair(address(this), otherToken);
        ERC20(otherToken).approve(address(uniswapV2Router), type(uint256).max);
        whiteList[swap] = true;
        _approve(address(this), swap,type(uint256).max);
        _approve(fundAddr, address(swap),type(uint256).max);
        //transferOwnership(holder);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(amount > 0, "amount must gt 0");
        if(from != pair && to != pair) {
            super._transfer(from, to, amount);
            return;
        }
        if(from == pair) {
            if(whiteList[to]){
                super._transfer(from, to, amount);
                return;
            }
            require(opentTime>0, "not open");
            if(block.timestamp-opentTime<=time1){
                super._transfer(from, fundAddr, amount*buyRate/100);
                amount-=amount*buyRate/100;
            }
            super._transfer(from, to, amount);
            return;
        }
        if(to == pair) {
            if(whiteList[from]){
                super._transfer(from, to, amount);
                return;
            }
            require(opentTime>0, "not open");
            if(block.timestamp-opentTime<=time1){
                super._transfer(from, fundAddr, amount*sellRate1/100);
                amount-=amount*sellRate1/100;
            }else if(block.timestamp-opentTime<=time2){
                super._transfer(from, fundAddr, amount*sellRate2/100);
                amount-=amount*sellRate2/100;
            }else if(block.timestamp-opentTime<=time3){
                super._transfer(from, fundAddr, amount*sellRate3/100);
                amount-=amount*sellRate3/100;
            }else{
                if(sellRate>0){
                    super._transfer(from, fundAddr, amount*sellRate/100);
                    amount-=amount*sellRate/100;
                }
            }
            super._transfer(from, to, amount);
            return;
        }
    }
    
    function withdawOwner(uint256 amount) public onlyOwner{
        payable(msg.sender).transfer(amount);
    }
    
    function errorToken(address _token) external onlyOwner{
        IERC20(_token).transfer(msg.sender, IERC20(_token).balanceOf(address(this)));
    }
}
