// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/access/Ownable.sol";
import "../ISwapRouter.sol";
import "../ISwapFactory.sol";
import "../IPancakePair.sol";

contract DuckInscription is Ownable{
    
    address public fundAddr;

    uint256 public mintRate=100;

    string public protocol="asc-20";//协议
    
    bool public switchOn=true;

    constructor(address _token,address _weth){
        fundAddr=msg.sender;
        token=_token;
        weth=_weth;
        //address swap=0x10ED43C718714eb63d5aA57B78B54704E256024E;//bsc main
        address swap=0x60aE616a2155Ee3d9A68541Ba4544862310933d4;//avax main
        //address swap=0xD99D1c33F9fC3444f8101754aBC46c52416550D1;//bsc test
        uniswapV2Router = ISwapRouter(swap);
        IERC20(token).approve(address(uniswapV2Router), type(uint256).max);
    }

    function bindToken(address _swap,address _token,address _weth)public onlyOwner{
        token=_token;
        weth=_weth;
        address swap=_swap;
        uniswapV2Router = ISwapRouter(swap);
        IERC20(token).approve(address(uniswapV2Router), type(uint256).max);
    }

    function setProtocol(string memory _protocol)public{
        protocol=_protocol;
    }

    struct InscriptionMeta{
        uint256 num;
        uint256 deployTime;
        uint256 holders;
        uint256 transtractions;
        uint256 supply;
        uint256 limit;
        uint256 progress;
        address owner;
        uint256 free;
        string name;
    }

    struct Record{
        uint256 num;
        address owner;
        address to;
        uint256 time;
        uint256 op;//1.deploy 2.mint 3.transfer
        uint256 max;
        uint256 lim;
        uint256 amt;
        string tick;
    }
    //记录所有的铭文
    mapping(uint256=>InscriptionMeta) public inscriptions;
    //铭文下标
    mapping(string=>uint256) public inscriptionIndex;
    //记录所有的铸造，部署和转账
    mapping(uint256=>Record) public records;
    //每个铭文的记录
    mapping(uint256=>uint256[])public inscriptionRecords;
    //每个铭文记录的数量
    mapping(uint256=>uint256)public inscriptionRecordsCount;

    //记录用户铭文的数量
    mapping(address=>mapping(uint256=>uint256)) public balanceOf;
    //用户铭文数量
    mapping(address=>uint256) public typeCount;
    //用户下标的铭文名称
    mapping(address=>mapping(uint256=>uint256)) public indexName;
    //铭文对应坐标的用户
    mapping(uint256=>mapping(uint256=>address))public holders;
    //铭文对应持有数量
    mapping(uint256=>uint256)public holdersCount;
    //当前总记录数
    uint256 public recordCounter=0;
    //当前铭文部署数量
    uint256 public inscriptionCounter=0;

    //用户对应的hash记录
    mapping(address=>mapping(uint256=>uint256)) public ownerActivity;
    //用户hash数量
    mapping(address=>uint256) public ownerActivityCount;

    //mint间隔
    uint256 public timeInterval=1 minutes;
    //用户上次mint时间
    mapping(address=>uint256) public mintTime;
    //额外奖励代币数量
    uint256 public rewardTokenCount=20000000*10**18;
    //每张铭文包含代币数量
    uint256 public exchargeToken=100000000*10**18;
    //每次mint第五天后才能参与兑换
    uint256 public lockTime=5 days;
    //每第多少个mint触发额外奖励
    uint256 public random=11;
    //当前mint数量
    uint256 public mintCounter;
    //代币地址
    address public token;
    //交易对代币地址
    address public weth;
    //指定铭文策略
    uint256 public platformNum=1;
    ISwapRouter private uniswapV2Router;
    IPancakePair public liquidityPair;
    address public deadAddr=0x000000000000000000000000000000000000dEaD;
    //铭文兑换记录
    mapping(uint256=>bool) public exchargeRecord;
    function setTokenAmount(uint256 _rewardTokenCount,uint256 _exchargeToken,uint256 _random,uint256 _lockTime,uint256 _platformNum)external onlyOwner{
        rewardTokenCount=_rewardTokenCount;
        _exchargeToken=exchargeToken;
        random=_random;
        lockTime=_lockTime;
        platformNum=_platformNum;
    }
    //铭文兑换
    function excharge(uint256 _num)public{
        require(!exchargeRecord[_num],"Redeemed");
        require(records[_num].op==2,"not mint");
        require(records[_num].owner==msg.sender,"not owner");
        require(balanceOf[msg.sender][inscriptionIndex[records[_num].tick]]>=records[_num].amt,"Insufficient Balance");
        require(block.timestamp-records[_num].time>lockTime,"often");
        require(inscriptions[inscriptionIndex[records[_num].tick]].num==platformNum,"not alow");
        if(IERC20(token).balanceOf(address(this))>=exchargeToken){
            exchargeRecord[_num]=true;
            IERC20(token).transfer(msg.sender,exchargeToken);
            balanceOf[msg.sender][inscriptionIndex[records[_num].tick]]-=records[_num].amt;
        }
    }
    //铭文兑换
    function exchargeBalance(uint256 num,uint256 amount)public{
        require(num==platformNum,"not alow");
        require(balanceOf[msg.sender][num]>=amount,"Insufficient Balance");
        if(IERC20(token).balanceOf(address(this))>=amount*10**18){
            IERC20(token).transfer(msg.sender,amount*10**18);
            balanceOf[msg.sender][num]-=amount;
        }
    }

    //判断用户是否存在某个铭文
    function existsName(address _addr,uint256 _inscriptionIndex) public view returns(bool){
        for(uint256 i=0;i<typeCount[_addr];i++){
            if(indexName[_addr][i+1]==_inscriptionIndex){
                return true;
            }
        }
        return false;
    }
    //为用户增加铭文
    function addName(address _addr,uint256 _inscriptionIndex)internal {
        if(existsName(_addr,_inscriptionIndex)){
            return;
        }
        typeCount[_addr]++;
        indexName[_addr][typeCount[_addr]]=_inscriptionIndex;
        holdersCount[_inscriptionIndex]++;
        holders[_inscriptionIndex][holdersCount[_inscriptionIndex]]=_addr;
    }

    function deploy(string memory input,uint256 _free)public{
        (string memory p, string memory op, string memory tick, string memory total, string memory limit)=deployData(input);
        require(inscriptionIndex[tick]==0,"tick exists");
        require(areStringsEqual(op,"deploy"),"op not alow");
        require(areStringsEqual(p,protocol),"protocol not alow");
        require(getStringLength(tick)==4,"tick length not alow");
        require(_free<=10**17,"tick length not alow");
        require(switchOn,"not open");
        uint256 supply=stringToUint(total);
        uint256 limitCount=stringToUint(limit);
        require(supply/limitCount*limitCount==supply,"limit not alow");
        inscriptionCounter++;
        inscriptionIndex[tick]=inscriptionCounter;
        inscriptions[inscriptionCounter]=InscriptionMeta({
            num:inscriptionCounter,
            deployTime:block.timestamp,
            holders:0,
            transtractions:1,
            supply:supply,
            limit:limitCount,
            progress:0,
            free:_free,
            owner:msg.sender,
            name:tick
        });
        recordCounter++;
        records[recordCounter]=Record({
            num:recordCounter,
            owner:msg.sender,
            to:msg.sender,
            time:block.timestamp,
            op:1,
            amt:0,
            max:supply,
            lim:limitCount,
            tick:tick
        });
        inscriptionRecords[recordCounter].push(recordCounter);
        inscriptionRecordsCount[recordCounter]+=1;
        ownerActivityCount[msg.sender]++;
        ownerActivity[msg.sender][ownerActivityCount[msg.sender]]=recordCounter;
    }
    
    function mint(string memory input) payable public{
        (string memory p, string memory op, string memory tick, string memory amt)=mintData(input);
        uint256 amountTobuy = inscriptions[inscriptionIndex[tick]].free;
        require(inscriptionIndex[tick]>0,"tick not exists");
        uint256 count=stringToUint(amt);
        require(inscriptions[inscriptionIndex[tick]].limit==count,"amt not alow");
        require(inscriptions[inscriptionIndex[tick]].progress+count<=inscriptions[inscriptionIndex[tick]].supply,"amt not alow");
        require(areStringsEqual(op,"mint"),"op not alow");
        require(areStringsEqual(p,protocol),"protocol not alow");
        require(block.timestamp-mintTime[msg.sender]>timeInterval,"often");
        payable(inscriptions[inscriptionIndex[tick]].owner).transfer(amountTobuy*(100-mintRate)/100);
        if(mintRate>0){
            uint256 ethAmount=amountTobuy*mintRate/100;
            liquidityPair = IPancakePair(ISwapFactory(uniswapV2Router.factory()).getPair(weth, token));
            if(address(liquidityPair)!=address(0)){
                address[] memory path = new address[](2);
                path[0] = weth;
                path[1] = token;
                uniswapV2Router.swapExactAVAXForTokens{value: ethAmount/2}(
                    0, // accept any amount of DUCK
                    path,
                    address(this),
                    block.timestamp
                );
                (uint256 amountToken, uint256 amountETH, ) = uniswapV2Router.addLiquidityAVAX{
                    value: ethAmount/2
                }(
                    token,
                    IERC20(token).balanceOf(address(this)),
                    0,
                    0,
                    address(this),
                    block.timestamp
                );
                // Transfer LP tokens to the blackhole address
                liquidityPair.transfer(deadAddr, liquidityPair.balanceOf(address(this)));
            }
        }
        inscriptions[inscriptionIndex[tick]].transtractions+=1;
        inscriptions[inscriptionIndex[tick]].progress+=count;
        if(!existsName(msg.sender,inscriptionIndex[tick])){
            inscriptions[inscriptionIndex[tick]].holders+=1;
        }
        recordCounter++;
        records[recordCounter]=Record({
            num:recordCounter,
            owner:msg.sender,
            to:msg.sender,
            time:block.timestamp,
            op:2,
            amt:count,
            max:0,
            lim:0,
            tick:tick
        });
        inscriptionRecords[inscriptionIndex[tick]].push(recordCounter);
        inscriptionRecordsCount[inscriptionIndex[tick]]+=1;
        balanceOf[msg.sender][inscriptionIndex[tick]]+=count;
        addName(msg.sender,inscriptionIndex[tick]);
        ownerActivityCount[msg.sender]++;
        ownerActivity[msg.sender][ownerActivityCount[msg.sender]]=recordCounter;
        if(inscriptions[inscriptionIndex[tick]].num==platformNum){
            mintTime[msg.sender]=block.timestamp;
            mintCounter++;
            if(random>0){
                if(mintCounter/random*random==mintCounter){
                    if(IERC20(token).balanceOf(address(this))>=rewardTokenCount){
                        IERC20(token).transfer(msg.sender,rewardTokenCount);
                    }
                }
            }
        }
        if(address(this).balance>0){
            payable(msg.sender).transfer(address(this).balance);
        }
    }
    
    function transfer(string memory input,address to) public{
        (string memory p, string memory op, string memory tick, string memory amt)=transferData(input);
        require(inscriptionIndex[tick]>0,"tick not exists");
        uint256 count=stringToUint(amt);
        require(balanceOf[msg.sender][inscriptionIndex[tick]]>=count,"balanceOf not enough");
        require(areStringsEqual(op,"transfer"),"op not alow");
        require(areStringsEqual(p,protocol),"protocol not alow");
        inscriptions[inscriptionIndex[tick]].transtractions+=1;
        if(!existsName(to,inscriptionIndex[tick])){
            inscriptions[inscriptionIndex[tick]].holders+=1;
        }
        recordCounter++;
        records[recordCounter]=Record({
            num:recordCounter,
            owner:msg.sender,
            to:to,
            time:block.timestamp,
            op:3,
            amt:count,
            max:0,
            lim:0,
            tick:tick
        });
        inscriptionRecords[inscriptionIndex[tick]].push(recordCounter);
        inscriptionRecordsCount[inscriptionIndex[tick]]+=1;
        _transfer(tick,msg.sender,to,count);
        ownerActivityCount[msg.sender]++;
        ownerActivity[msg.sender][ownerActivityCount[msg.sender]]=recordCounter;
    }
    
    function withdawOwner() public onlyOwner{
        uint256 amount=address(this).balance;
        payable(fundAddr).transfer(amount);
    }
    
    function errorToken(address _token) external onlyOwner{
        IERC20(_token).transfer(msg.sender, IERC20(_token).balanceOf(address(this)));
    }
    
    function setFundAddrAndRate(address _fundAddr,uint256 _mintRate) external onlyOwner{
        fundAddr=_fundAddr;
        mintRate=_mintRate;
    }
    
    function setSwitch(bool _switch) external onlyOwner{
        switchOn=_switch;
    }
    
    function searchItems(string memory _keyword) public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](inscriptionCounter);
        uint256 count = 0;
        for (uint256 i = 1; i <= inscriptionCounter; i++) {
            if (contains(inscriptions[inscriptionCounter].name, _keyword)) {
                result[count] = i;
                count++;
            }
        }

        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        return finalResult;
    }
    
    function contains(string memory _source, string memory _substring) internal pure returns (bool) {
        bytes memory source = bytes(_source);
        bytes memory ss = bytes(_substring);

        for (uint256 i = 0; i <= source.length - ss.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < ss.length; j++) {
                if (source[i + j] != ss[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }

        return false;
    }

    function mintData(string memory input) internal pure returns (string memory p,string memory op, string memory tick, string memory amt) {
        bytes memory inputBytes = bytes(input);

        uint pStart = indexOf(inputBytes, bytes("\"p\":\"") ) + 5;
        uint pEnd = indexOf(inputBytes, bytes("\",\"op\"") );

        uint opStart = indexOf(inputBytes, bytes("\"op\":\"") ) + 6;
        uint opEnd = indexOf(inputBytes, bytes("\",\"tick\"") );

        uint tickStart = indexOf(inputBytes, bytes("\"tick\":\"") ) + 8;
        uint tickEnd = indexOf(inputBytes, bytes("\",\"amt\"") );

        uint amtStart = indexOf(inputBytes, bytes("\"amt\":\"") ) + 7;
        uint amtEnd = indexOf(inputBytes, bytes("\"}"));

        p = substring(inputBytes, pStart, pEnd - pStart);
        op = substring(inputBytes, opStart, opEnd - opStart);
        tick = substring(inputBytes, tickStart, tickEnd - tickStart);

        amt = extractNumber(inputBytes, amtStart, amtEnd - amtStart);
    }
    

    function transferData(string memory input) internal pure returns (string memory p,string memory op, string memory tick, string memory amt) {
        bytes memory inputBytes = bytes(input);

        uint pStart = indexOf(inputBytes, bytes("\"p\":\"") ) + 5;
        uint pEnd = indexOf(inputBytes, bytes("\",\"op\"") );
        uint opStart = indexOf(inputBytes, bytes("\"op\":\"") ) + 6;
        uint opEnd = indexOf(inputBytes, bytes("\",\"tick\"") );

        uint tickStart = indexOf(inputBytes, bytes("\"tick\":\"") ) + 8;
        uint tickEnd = indexOf(inputBytes, bytes("\",\"amt\"") );

        uint amtStart = indexOf(inputBytes, bytes("\"amt\":\"") ) + 7;
        uint amtEnd = indexOf(inputBytes, bytes("\"}"));

        p = substring(inputBytes, pStart, pEnd - pStart);
        op = substring(inputBytes, opStart, opEnd - opStart);
        tick = substring(inputBytes, tickStart, tickEnd - tickStart);

        amt = extractNumber(inputBytes, amtStart, amtEnd - amtStart);
    }

    function deployData(string memory input) internal pure returns (string memory p,string memory op, string memory tick, string memory total, string memory limit) {
        bytes memory inputBytes = bytes(input);

        uint pStart = indexOf(inputBytes, bytes("\"p\":\"") ) + 5;
        uint pEnd = indexOf(inputBytes, bytes("\",\"op\"") );
        uint opStart = indexOf(inputBytes, bytes("\"op\":\"")) + 6;
        uint opEnd = indexOf(inputBytes, bytes("\",\"tick\""));

        uint tickStart = indexOf(inputBytes, bytes("\"tick\":\"")) + 8;
        uint tickEnd = indexOf(inputBytes, bytes("\",\"total\""));
        uint totalStart = indexOf(inputBytes, bytes("\"total\":\"")) + 9;
        uint totalEnd = indexOf(inputBytes, bytes("\",\"limit\""));

        uint limitStart = indexOf(inputBytes, bytes("\"limit\":\"")) + 9;
        uint limitEnd = indexOf(inputBytes, bytes("\"}"));

        p = substring(inputBytes, pStart, pEnd - pStart);
        op = substring(inputBytes, opStart, opEnd - opStart);
        tick = substring(inputBytes, tickStart, tickEnd - tickStart);

        total = extractNumber(inputBytes, totalStart, totalEnd - totalStart);
        limit = extractNumber(inputBytes, limitStart, limitEnd - limitStart);
    }
    
    function substring(bytes memory strBytes, uint start, uint length) internal pure returns (string memory) {
        bytes memory result = new bytes(length);
        for (uint i = 0; i < length; i++) {
            result[i] = strBytes[start + i];
        }
        return string(result);
    }

    function extractNumber(bytes memory strBytes, uint start, uint length) internal pure returns (string memory) {
        bytes memory result = new bytes(length);
        uint resultIndex = 0;
        for (uint i = 0; i < length; i++) {
            bytes1 character = strBytes[start + i];
            if ((character >= bytes1("0") && character <= bytes1("9")) || character == bytes1(".")) { 
                result[resultIndex++] = character;
            }
        }

        return string(result);
    }

    function indexOf(bytes memory haystack, bytes memory needle) internal pure returns (uint) {
        uint hLen = haystack.length;
        uint nLen = needle.length;

        for (uint i = 0; i <= hLen - nLen; i++) {
            bool found = true;
            for (uint j = 0; j < nLen; j++) {
                if (haystack[i + j] != needle[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return i;
            }
        }
        return type(uint).max;
    }
    function stringToUint(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 result = 0;

        for (uint256 i = 0; i < b.length; i++) {
            require(uint8(b[i]) >= 48 && uint8(b[i]) <= 57, "Invalid character in input");
            result = result * 10 + (uint256(uint8(b[i])) - 48); 
        }

        return result;
    }
    function areStringsEqual(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
    function getStringLength(string memory str) internal pure returns (uint) {
        bytes memory strBytes = bytes(str);
        return strBytes.length;
    }

    function transferFrom(string memory tick,address from, address to, uint256 amount) public virtual returns (bool) {
        require(inscriptionIndex[tick]>0,"tick not exists");
        address spender = _msgSender();
        _spendAllowance(tick,from, spender, amount);
        inscriptions[inscriptionIndex[tick]].transtractions+=1;
        if(!existsName(to,inscriptionIndex[tick])){
            inscriptions[inscriptionIndex[tick]].holders+=1;
        }
        recordCounter++;
        string memory amountStr = toString(amount);
        string memory jsonString = '{"p":"src-20","op":"transferFrom","tick":"';
        jsonString = string(abi.encodePacked(jsonString, tick, '","amt":"', amountStr, '"}'));
        records[recordCounter]=Record({
            num:recordCounter,
            owner:from,
            to:to,
            time:block.timestamp,
            op:3,
            amt:amount,
            max:0,
            lim:0,
            tick:tick
        });
        inscriptionRecords[inscriptionIndex[tick]].push(recordCounter);
        inscriptionRecordsCount[inscriptionIndex[tick]]+=1;
        _transfer(tick,from, to, amount);
        ownerActivityCount[msg.sender]++;
        ownerActivity[msg.sender][ownerActivityCount[msg.sender]]=recordCounter;
        return true;
    }
    
    mapping(address => mapping(string =>mapping(address => uint256))) private _allowances;
    
    function allowance(string memory tick,address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][tick][spender];
    }
    function _spendAllowance(string memory tick,address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(tick,owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "insufficient allowance");
            unchecked {
                _approve(tick,owner, spender, currentAllowance - amount);
            }
        }
    }
    
    function approve(string memory tick,address spender, uint256 amount) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(tick,owner, spender, amount);
        return true;
    }

    function _approve(string memory tick,address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "approve from the zero address");
        require(spender != address(0), "approve to the zero address");
        _allowances[owner][tick][spender] = amount;
    }
    
    function _transfer(string memory tick,address from, address to, uint256 amount) private{
        require(from != address(0), "transfer from the zero address");
        require(to != address(0), "transfer to the zero address");
        require(balanceOf[from][inscriptionIndex[tick]] >= amount, "transfer amount exceeds balance");
        balanceOf[from][inscriptionIndex[tick]]-=amount;
        balanceOf[to][inscriptionIndex[tick]]+=amount;
        addName(to,inscriptionIndex[tick]);
    }
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + value % 10));
            value /= 10;
        }

        return string(buffer);
    }
    
    function swapToken(uint256 tokenAmount,address to) private{
        address[] memory path = new address[](2);
        path[0] = weth;
        path[1] = token;
        uniswapV2Router.swapExactTokensForTokensSupportingFeeOnTransferTokens(tokenAmount,0,path,to,block.timestamp);
    }
}
