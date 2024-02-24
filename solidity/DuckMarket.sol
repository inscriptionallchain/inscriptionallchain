// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/access/Ownable.sol";
import "./DuckInscriptionInterface.sol";

contract DuckMarket is Ownable{
    
    DuckInscriptionInterface inscription;

    uint256 public saleRate=2;//卖出手续费

    address public fundAddr=0xe048722762Bf7763D4c816De570Db04B6D42988e;

    constructor(address _inscription){
        //fundAddr=msg.sender;
        inscription=DuckInscriptionInterface(_inscription);
    }
    function withdawOwner() public onlyOwner{
        uint256 amount=address(this).balance;
        payable(fundAddr).transfer(amount);
    }
    
    function errorToken(address _token) external onlyOwner{
        IERC20(_token).transfer(msg.sender, IERC20(_token).balanceOf(address(this)));
    }
    
    function setFundAddrAndRate(address _fundAddr,uint256 _saleRate) external onlyOwner{
        fundAddr=_fundAddr;
        saleRate=_saleRate;
    }

    function setSwitchOn(string memory _name, bool _open) external onlyOwner{
        tokenInfo[_name].switchOn=_open;
    }

    struct Item{
        uint256 num;
        uint256 price;//总价
        uint256 uintPrice;//单价price/count
        uint256 count;
        address owner;
        uint256 op;//1.销售中 2.已售出 3.已撤销
        uint256 addTime;//上架时间
        uint256 updateTime;//更新时间
        string name;
    }

    struct Record{
        uint256 itemIndex;//购买的编号
        uint256 time;//购买时间
        uint256 count;//购买数量
        uint256 price;//购买价格
        uint256 uintPrice;//单价price/count
        address owner;//购买者
    }

    struct Token{
        uint256 num;//铭文在市场中的序号
        bool switchOn;//铭文的市场功能是否开放
        uint256 floorPrice;//铭文对应地板价
        uint256 volume;//铭文对应上架数量
        uint256 sales;//铭文对应销量
        uint256 salePrice;//铭文销售总价
        uint256 supply;//铭文上架总记录数
        uint256 buyCount;//铭文对应的购买记录数（每次购买加1）
        uint256 itemIndex;//每个铭文对应市场数量(用于记录items的下标)
        string name;//铭文名称
    }
    //铭文信息
    mapping(string=>Token) public tokenInfo;
    //索引对应铭文信息
    mapping(uint256=>string) public tokenIndex;
    //铭文对应购买记录
    mapping(string=>mapping(uint256=>Record)) public buyRecords;
    //我的购买记录,对应在record中的下标
    mapping(address=>mapping(uint256=>uint256)) public myOrders;
    //我的购买总数
    mapping(address=>uint256) public myOrdersCount;
    //记录所有的市场信息
    mapping(string=>mapping(uint256 => Item)) public items;
    mapping(string=>mapping(uint256 => Node)) public linkedList;
    mapping(string=>uint256) public head;
    //市场铭文数量
    uint256 public tokens=0;

    //上市
    function list(string memory _name)public onlyOwner{
        if(tokenInfo[_name].num==0){
            tokens++;
            tokenInfo[_name].num=tokens;
            tokenInfo[_name].name=_name;
            tokenIndex[tokens]=_name;
        }
        tokenInfo[_name].switchOn=true;
    }
    //用户上市
    function listByOwner(uint256 num)public{
        (uint256 num,uint256 deployTime,uint256 _holders,uint256 transtractions,uint256 supply,uint256 limit,
        uint256 progress,address owner,uint256 free,string memory name)=inscription.inscriptions(num);
        require(owner==msg.sender,"not owner");
        require(supply==progress,"progress error");
        if(tokenInfo[name].num==0){
            tokens++;
            tokenInfo[name].num=tokens;
            tokenInfo[name].name=name;
            tokenIndex[tokens]=name;
            tokenInfo[name].switchOn=true;
        }
    }
    //退市
    function unlist(string memory _name)public onlyOwner{
        tokenInfo[_name].switchOn=false;
    }
    //上架
    function sale(string memory _name,uint256 _price,uint256 _amount)public{
        require(tokenInfo[_name].switchOn,"tick not open");
        require(tokenInfo[_name].num>0,"not list");
        uint256 uintPrice=_price/_amount;
        inscription.transferFrom(_name, msg.sender, address(this), _amount);
        tokenInfo[_name].itemIndex++;
        items[_name][tokenInfo[_name].itemIndex]=Item({
            num:tokenInfo[_name].itemIndex,
            price:_price,
            uintPrice:uintPrice,
            count:_amount,
            owner:msg.sender,
            op:1,
            addTime:block.timestamp,
            updateTime:block.timestamp,
            name:_name
        });
        insertIntoSortedLinkedList(_name,tokenInfo[_name].itemIndex);
        tokenInfo[_name].floorPrice=items[_name][linkedList[_name][head[_name]].itemIndex].uintPrice;
        tokenInfo[_name].supply+=_amount;
        tokenInfo[_name].volume+=_amount;
        Item memory i=getFirstItem(_name);
        tokenInfo[_name].floorPrice=i.uintPrice;
    }
    //取消
    function cancel(string memory _name,uint256 itemIndex)public{
        Item memory item=items[_name][itemIndex];
        require(item.owner==msg.sender,"not alow");
        require(item.op==1,"already cancel");
        items[_name][itemIndex].op=3;
        items[_name][itemIndex].updateTime=block.timestamp;
        removeFromLinkedList(_name,itemIndex);
        if(tokenInfo[_name].volume>item.count){
            tokenInfo[_name].volume-=item.count;
        }
        string memory amountStr = toString(item.count);
        string memory protocol=inscription.protocol();
        string memory jsonString = string(abi.encodePacked(
            '{"p":"', protocol, '","op":"transfer","tick":"', _name, '","amt":"', amountStr, '"}'
        ));
        inscription.transfer(jsonString, msg.sender);
    }
    //购买
    function buy(string memory _name,uint256 itemIndex)payable public{
        Item memory item=items[_name][itemIndex];
        require(item.owner!=msg.sender,"not alow");
        require(item.op==1,"already cancel");
        payable(item.owner).transfer(item.price*(100-saleRate)/100);
        if(saleRate>0){
            payable(fundAddr).transfer(item.price*saleRate/100);
        }
        items[_name][itemIndex].op=2;
        items[_name][itemIndex].updateTime=block.timestamp;
        removeFromLinkedList(_name,itemIndex);
        if(tokenInfo[_name].volume>item.count){
            tokenInfo[_name].volume-=item.count;
        }
        tokenInfo[_name].sales+=item.count;
        tokenInfo[_name].salePrice+=item.price;
        string memory amountStr = toString(item.count);
        string memory protocol=inscription.protocol();
        string memory jsonString = string(abi.encodePacked(
            '{"p":"', protocol, '","op":"transfer","tick":"', _name, '","amt":"', amountStr, '"}'
        ));
        inscription.transfer(jsonString, msg.sender);
        tokenInfo[_name].buyCount+=1;
        myOrdersCount[msg.sender]++;
        buyRecords[_name][tokenInfo[_name].buyCount]=Record({
            itemIndex:itemIndex,
            time:block.timestamp,
            count:item.count,//购买数量
            price:item.price,//购买价格
            uintPrice:item.uintPrice,//单价
            owner:msg.sender//购买者
        });
        myOrders[msg.sender][myOrdersCount[msg.sender]]=tokenInfo[_name].buyCount;
        myOrdersCount[item.owner]++;
        myOrders[item.owner][myOrdersCount[item.owner]]=tokenInfo[_name].buyCount;
    }
    struct Node {
        uint256 itemIndex;
        uint256 next;
    }
    
    function insertItem(string memory _name,uint256 itemIndex) internal returns (uint256) {
        // 创建新的链表节点
        uint256 newNode = uint256(keccak256(abi.encodePacked(itemIndex, block.number)));
        linkedList[_name][newNode] = Node(itemIndex, 0);
        return newNode;
    }
    function insertIntoSortedLinkedList(string memory _name,uint256 itemIndex) internal {
        uint256 newNode = insertItem(_name,itemIndex);

        if (head[_name] == 0 || items[_name][linkedList[_name][head[_name]].itemIndex].uintPrice >= items[_name][itemIndex].uintPrice) {
            // 如果链表为空或者插入位置在链表头
            linkedList[_name][newNode].next = head[_name];
            head[_name] = newNode;
        } else {
            // 在链表中找到合适的位置插入
            uint256 current = head[_name];

            while (
                linkedList[_name][current].next != 0 &&
                items[_name][linkedList[_name][linkedList[_name][current].next].itemIndex].uintPrice < items[_name][itemIndex].uintPrice
            ) {
                current = linkedList[_name][current].next;
            }

            linkedList[_name][newNode].next = linkedList[_name][current].next;
            linkedList[_name][current].next = newNode;
        }
    }
    function getSortedItems(string memory _name) public view returns (Item[] memory) {
        uint256 currentIndex = head[_name];
        uint256 count = 0;

        // Count the number of items in the linked list
        while (currentIndex != 0) {
            count++;
            currentIndex = linkedList[_name][currentIndex].next;
        }

        // Create an array to store the sorted items
        Item[] memory sortedItems = new Item[](count);
        currentIndex = head[_name];

        // Populate the array with sorted items
        for (uint256 i = 0; i < count; i++) {
            sortedItems[i] = items[_name][linkedList[_name][currentIndex].itemIndex];
            currentIndex = linkedList[_name][currentIndex].next;
        }

        return sortedItems;
    }

    function getFirstItem(string memory _name) public view returns (Item memory) {
        uint256 currentIndex = head[_name];
        return items[_name][linkedList[_name][currentIndex].itemIndex];
    }
    
    function removeFromLinkedList(string memory _name,uint256 itemIndex) internal {
        uint256 current = head[_name];
        uint256 previous = 0;
        // 找到要移除的铭文的位置
        while (current != 0 && items[_name][linkedList[_name][current].itemIndex].num != itemIndex) {
            previous = current;
            current = linkedList[_name][current].next;
        }

        require(current != 0, "Item not found in the linked list");

        // 更新相邻节点的 next 指针，绕过要移除的铭文
        if (previous == 0) {
            // 如果要移除的是头节点
            head[_name] = linkedList[_name][current].next;
        } else {
            linkedList[_name][previous].next = linkedList[_name][current].next;
        }

        // 清理被移除节点的数据
        delete linkedList[_name][current];
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

}
