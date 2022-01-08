pragma solidity ^0.8.2;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IDaoTreasury } from "./interfaces/IDaoTreasury.sol";

contract DaoTreasury is Ownable, IDaoTreasury {

    address private _governor;

    constructor() Ownable() public {}

    function getGovernor() public view override returns(address) {
        return _governor;
    }

    function setGovernor(address _newGovernor) public override onlyOwner {
        _governor = _newGovernor;
    }

    /**
     * @dev Function to receive ETH that will be handled by the governor (disabled if executor is a third party contract)
     */
    receive() external payable virtual {}
    
}