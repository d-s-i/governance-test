pragma solidity ^0.8.2;

interface IMyGovernor {

    /// @notice 1 block ~ 13.2 seconds;
    function setVotingDelay(uint256 _newVotingDelayInBlocks) external;

    /// @notice 45818 blocks === 1 week
    function setVotingPeriod(uint256 _newVotingPeriodInBlocks) external;
}