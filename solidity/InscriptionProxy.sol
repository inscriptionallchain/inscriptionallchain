// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/docs-v4.x/contracts/access/Ownable.sol";
import "./InscriptionInterface.sol";

contract InscriptionProxy is Ownable{
    
    InscriptionInterface inscription;

    struct Holders{
        address holder;
        uint256 value;
        uint256 percentage;
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

    constructor(address _inscription){
        inscription=InscriptionInterface(_inscription);
    }
    
    function setInscription(address _inscription) external onlyOwner{
        inscription=InscriptionInterface(_inscription);
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
        uint256 count;
        string inscription;
        string input;
    }

    function holders(uint256 tokenId)public view returns(Holders[] memory){
        (uint256 num,uint256 deployTime,uint256 _holders,uint256 transtractions,uint256 supply,uint256 limit,
        uint256 progress,address owner,uint256 free,string memory name)=inscription.inscriptions(tokenId);
        Holders[] memory temp=new Holders[](_holders);
        for(uint256 i=1;i<=_holders;i++){
            HolderInfo memory info = getHolderInfo(tokenId, i, name, supply);
            temp[i - 1] = Holders({
                holder: info.ol,
                value: info.val,
                percentage: info.percentage
            });
        }
        return temp;
    }
    function getHolderInfo(uint256 tokenId, uint256 index, string memory name, uint256 supply) internal view returns (HolderInfo memory) {
        address ol = inscription.holders(tokenId, index);
        uint256 val = inscription.balanceOf(ol, name);
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
    function activity(string memory name,uint256 pageIndex,uint256 pageSize)public view returns(Record[] memory){
        uint256 counter=inscription.inscriptionRecordsCount(name);
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
            Record memory recordInfo = getRecord(name, i-1);
            temp[tempIndex] = Record({
                num: recordInfo.num,
                owner: recordInfo.owner,
                to: recordInfo.to,
                time: recordInfo.time,
                op: recordInfo.op,
                count: recordInfo.count,
                inscription: recordInfo.inscription,
                input: recordInfo.input
            });
            tempIndex++;
        }
        return temp;
    }
    
    function getRecord(string memory name, uint256 index) internal view returns (Record memory) {
        (uint256 num, address owner, address to, uint256 time, uint256 op, uint256 count, string memory inscription, string memory input) = inscription.inscriptionRecords(name, index);
        return Record({
            num: num,
            owner: owner,
            to: to,
            time: time,
            op: op,
            count: count,
            inscription: inscription,
            input: input
        });
    }

    function mintRecord(address _addr) public view returns(Record[] memory){
        uint256 total=inscription.recordCounter();
        Record[]memory r=new Record[](total);
        uint256 _index=0;
        for(uint256 i=0;i<total;i++){
            (uint256 num, address owner, address to, uint256 time, uint256 op, uint256 count, string memory inscription, string memory input) = inscription.records(i);
            if(owner==_addr){
                r[_index]=Record({
                    num: num,
                    owner: owner,
                    to: to,
                    time: time,
                    op: op,
                    count: count,
                    inscription: inscription,
                    input: input
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
    
}
