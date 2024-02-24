// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface DuckInscriptionInterface{
    

    function protocol()external view returns(string memory);
    
    //查询用户某个铭文余额
    function balanceOf(address _owner,uint256 _insIndex)external view returns(uint256);
    //每个铭文的记录
    function inscriptionRecords(uint256 _insIndex,uint256 _index)external view returns(uint256);
    //每个铭文记录的数量
    function inscriptionRecordsCount(uint256 _index)external view returns(uint256);

    function holders(uint256 _tokenId,uint256 _index)external view returns(address);
    
    function inscriptions(uint256 _tokenId)external view returns(uint256 num,uint256 deployTime,uint256 holders,uint256 transtractions,uint256 supply,uint256 limit,
        uint256 progress,address owner,uint256 free,string memory name);

    function recordCounter()external view returns(uint256);

    function records(uint256 _index)external view returns(uint256 num,
        address owner,
        address to,
        uint256 time,
        uint256 op,
        uint256 max,
        uint256 lim,
        uint256 amt,
        string memory tick);
        
    function transferFrom(string memory tick,address from, address to, uint256 amount) external returns (bool);

    function transfer(string memory input,address to)external;
}
