import { ethers } from "hardhat";
import assert from "assert";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { 
  sendEtherFrom, 
  hashDescription, 
  getProposalData, 
  sendProposal,
  mineBlocks,
  setNewBlockTimestamp,
  voteForFrom,
  goAfterVoteDeadline,
  getProposalStatetOf
} from "./helpers.test";

let deployer: SignerWithAddress;
let user: SignerWithAddress;

let myGovernor: Contract;
let token: Contract;
let daoTreasury: Contract;

const governorContractName = "ExEntricGovernance";

beforeEach(async function() {

  [deployer, user] = await ethers.getSigners();
  
  const Token = await ethers.getContractFactory("Token");
  const MyGovernor = await ethers.getContractFactory("MyGovernor");
  const DaoTreasury = await ethers.getContractFactory("DaoTreasury");

  token = await Token.deploy("ExEntric", "EXE");

  await token.mint(
    deployer.address,
    ethers.utils.parseEther("10000")
  );

  await token.delegate(deployer.address);

  const governorArgs = {
    token: token.address,
    name: governorContractName,
    votingDelay: 1,
    votingPeriod: 10
  };
  
  myGovernor = await MyGovernor.deploy(
    governorArgs.token,
    governorArgs.name,
    governorArgs.votingDelay,
    governorArgs.votingPeriod
  );

  daoTreasury = await DaoTreasury.deploy();

  await daoTreasury.setGovernor(myGovernor.address);

  await sendEtherFrom(deployer, myGovernor.address, 10);
  await sendEtherFrom(deployer, daoTreasury.address, 10);
  
});

describe("Governor", function () {

  it("Should deploy the DaoTreasury contract", async function () {
    assert.ok(
      typeof(daoTreasury.address) !== "undefined" &&
      daoTreasury.address
    );
  });

  it("Set the correct contract for governor", async function() {
    const governor = await daoTreasury.getGovernor();

    assert.equal(governor, myGovernor.address);
  });
  
  it("Should deploy the myGovernor contract", async function () {
    assert.ok(
      typeof(myGovernor.address) !== "undefined" &&
      myGovernor.address
    );
  });

  it("MyGovernor has a name", async function() {
    const contractName = await myGovernor.name();

    assert.equal(contractName, governorContractName);
  });

  it("Send Ether to the Governor", async function() {
    const governorEthBalances = await deployer.provider!.getBalance(myGovernor.address);
    
    assert.ok(governorEthBalances.eq(ethers.utils.parseEther("10")));
  });

  it("Send Ether to the DAO", async function() {
    const governorEthBalances = await deployer.provider!.getBalance(daoTreasury.address);
    
    assert.ok(governorEthBalances.eq(ethers.utils.parseEther("10")));
  });
  
  it("Create a proposal", async function() {

    const firstProposalHash = await sendProposal(
      { functionName: "sendEther", args: [ethers.utils.parseEther("1"), user.address] },
      { callAddresses: [myGovernor.address], msgValues: [ethers.utils.parseEther("1")], description: "Trying to send ether" },
      myGovernor
    );

    const firstProposalState = await myGovernor.state(firstProposalHash);

    assert.equal(firstProposalState, 0);

  });

  it("Vote on a proposal", async function() {

    const description = "Trying to send ether";
    
    const proposalId = await sendProposal(
      { functionName: "sendEther", args: [ethers.utils.parseEther("1"), user.address] },
      { callAddresses: [myGovernor.address], msgValues: [ethers.utils.parseEther("1")], description },
      myGovernor
    );

    await voteForFrom(deployer, myGovernor, proposalId);

    const hasVoted = await myGovernor.hasVoted(proposalId, deployer.address);

    assert.ok(hasVoted);
  });

  it("Execute a proposal", async function() {
    const initialUserBalance = await user.getBalance();

    const description = "Trying to call a function";
    const functionName = "consoleLog";
    const args = ["lol"];
    const callAddresses = [myGovernor.address];
    const msgValues = [ethers.utils.parseEther("1")];
    
    const proposalId = await sendProposal(
      { functionName, args },
      { callAddresses, msgValues, description },
      myGovernor
    );

    const proposalData = await getProposalData(
      { functionName, args },
      { callAddresses, msgValues, description }
    );

    const descriptionHash = hashDescription(description);

    await voteForFrom(deployer, myGovernor, proposalId);

    await goAfterVoteDeadline(myGovernor, proposalId);

    await myGovernor.execute(
      proposalData[0],
      proposalData[1],
      proposalData[2],
      descriptionHash
    );
  });

});
