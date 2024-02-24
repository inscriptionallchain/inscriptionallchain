// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/access/Ownable.sol";
import "./DuckInscriptionInterface.sol";

contract DuckInscriptionProxy is Ownable{
    
    DuckInscriptionInterface inscription;

    struct Holders{
        address holder;
        uint256 value;
        uint256 percentage;
    }

    constructor(address _inscription){
        inscription=DuckInscriptionInterface(_inscription);
    }
    
    function setInscription(address _inscription) external onlyOwner{
        inscription=DuckInscriptionInterface(_inscription);
    }
    struct HolderInfo {
        address ol;
        uint256 val;
        uint256 percentage;
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

    function holders(uint256 tokenId)public view returns(Holders[] memory){
        (uint256 num,uint256 deployTime,uint256 _holders,uint256 transtractions,uint256 supply,uint256 limit,
        uint256 progress,address owner,uint256 free,string memory name)=inscription.inscriptions(tokenId);
        Holders[] memory temp=new Holders[](_holders);
        for(uint256 i=1;i<=_holders;i++){
            HolderInfo memory info = getHolderInfo(tokenId, i, supply);
            temp[i - 1] = Holders({
                holder: info.ol,
                value: info.val,
                percentage: info.percentage
            });
        }
        return temp;
    }
    function getHolderInfo(uint256 tokenId, uint256 index, uint256 supply) internal view returns (HolderInfo memory) {
        address ol = inscription.holders(tokenId, index);
        uint256 val = inscription.balanceOf(ol, tokenId);
        uint256 percentage = val * 100 * 100000 / supply;

        return HolderInfo({
            ol: ol,
            val: val,
            percentage: percentage
        });
    }
    function test(uint256 pageIndex,uint256 pageSize)public pure returns(uint256){
        return pageIndex/pageSize;
    }
    function activity(uint256 _insIndex,uint256 pageIndex,uint256 pageSize)public view returns(Record[] memory){
        uint256 counter=inscription.inscriptionRecordsCount(_insIndex);
        uint256 start=counter-(pageIndex-1)*pageSize;
        uint256 total=counter/pageSize;
        if(total*pageSize<counter){
            total=total+1;
        }
        if(pageIndex>total){
            return new Record[](0);
        }
        uint256 end=0;
        if(start>=pageSize){
            end=start-pageSize;
        }
        Record[] memory temp=new Record[](start-end);
        uint256 tempIndex=0;
        for(uint256 i=start;i>end;i--){
            Record memory recordInfo = getRecord(_insIndex, i-1);
            temp[tempIndex] = Record({
                num: recordInfo.num,
                owner: recordInfo.owner,
                to: recordInfo.to,
                time: recordInfo.time,
                op: recordInfo.op,
                max:recordInfo.max,
                lim:recordInfo.lim,
                amt:recordInfo.amt,
                tick:recordInfo.tick
            });
            tempIndex++;
        }
        return temp;
    }
    
    function getRecord(uint256 _insIndex, uint256 index) internal view returns (Record memory) {
        (uint256 num, address owner, address to, uint256 time, uint256 op, uint256 max,
        uint256 lim,
        uint256 amt,
        string memory tick) = inscription.records(inscription.inscriptionRecords(_insIndex, index));
        return Record({
            num: num,
            owner: owner,
            to: to,
            time: time,
            op: op,
            max:max,
            lim:lim,
            amt:amt,
            tick:tick
        });
    }

    function mintRecord(address _addr) public view returns(Record[] memory){
        uint256 total=inscription.recordCounter();
        Record[]memory r=new Record[](total);
        uint256 _index=0;
        for(uint256 i=0;i<total;i++){
            (uint256 num, address owner, address to, uint256 time, uint256 op, uint256 max,
            uint256 lim,
            uint256 amt,
            string memory tick) = inscription.records(i);
            if(owner==_addr){
                r[_index]=Record({
                    num: num,
                    owner: owner,
                    to: to,
                    time: time,
                    op: op,
                    max:max,
                    lim:lim,
                    amt:amt,
                    tick:tick
                });
                _index++;
            }

        }
        uint256 mine=0;
        for(uint256 i=0;i<total;i++){
            if(r[i].num>0){
                mine++;
            }
        }
        Record[]memory result=new Record[](mine);
        for(uint256 i=0;i<mine;i++){
            result[i]=r[i];
        }
        return result;
    }
    function recordString(uint256 _index)public view returns(string memory){
        string memory protocol=inscription.protocol();
        (uint256 num, address owner, address to, uint256 time, uint256 op, uint256 max,
            uint256 lim,
            uint256 amt,
            string memory tick) = inscription.records(_index);
        string memory amountStr = toString(amt);
        if(op==1){
            string memory maxStr = toString(max);
            string memory limStr = toString(lim);
            string memory jsonString = string(abi.encodePacked(
                '{"p":"', protocol, '","op":"deploy","tick":"', tick, '","max":"', maxStr, '","lim":"', limStr, '"}'
            ));
            return jsonString;
        }else if(op==2){
            string memory jsonString = string(abi.encodePacked(
                '{"p":"', protocol, '","op":"mint","tick":"', tick, '","amt":"', amountStr, '"}'
            ));
            return jsonString;

        }else if(op==3){
            string memory jsonString = string(abi.encodePacked(
                '{"p":"', protocol, '","op":"transfer","tick":"', tick, '","amt":"', amountStr, '"}'
            ));
            return jsonString;

        }
        return "";
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
