// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

import { IMyGovernor } from "./interfaces/IMyGovernor.sol";

import "hardhat/console.sol";

contract MyGovernor is Governor, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, IMyGovernor {

    uint256 private _votingDelay;
    uint256 private _votingPeriod;

    uint256 private toast;

    event NewVotingDelay(uint256 blockNumber, uint256 newVotingDelay);
    event NewVotingPeriod(uint256 blockNumber, uint256 newVotingPeriod);
    
    constructor(
        ERC20Votes _token, 
        string memory _name,
        uint256 _votingDelayInBlocks,
        uint256 _votingPeriodInBlocks
    )
        Governor(_name)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {
        _votingDelay = _votingDelayInBlocks;
        _votingPeriod = _votingPeriodInBlocks;
        toast = 0;
    }

    function votingDelay() public view override(IGovernor) returns (uint256) {
        return _votingDelay; 
    }

    function votingPeriod() public view override(IGovernor) returns (uint256) {
        return _votingPeriod; 
    }

    function setVotingDelay(uint256 _newVotingDelayInBlocks) public override(IMyGovernor) onlyGovernance {
        _votingDelay = _newVotingDelayInBlocks;

        emit NewVotingDelay(block.number, _newVotingDelayInBlocks);
    }

    function setVotingPeriod(uint256 _newVotingPeriodInBlocks) public override(IMyGovernor) onlyGovernance {
        _votingPeriod = _newVotingPeriodInBlocks;

        emit NewVotingPeriod(block.number, _newVotingPeriodInBlocks);
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function getVotes(address account, uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotes)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function sendEther(uint256 _value, address _destination) public onlyGovernance {
        payable(_destination).transfer(_value);
    }

    function consoleLog(string memory _message) public {
        console.log(_message);
        toast++;
    }
}