pragma solidity ^0.8.2;

interface IDaoTreasury {
    function getGovernor() external view returns(address);
    function setGovernor(address _newGovernor) external;
}