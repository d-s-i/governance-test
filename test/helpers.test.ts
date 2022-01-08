import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

import { abi as MyGovernorAbi }  from "../artifacts/contracts/MyGovernor.sol/MyGovernor.json"

export const sendEtherFrom = async function(signer: SignerWithAddress, to: string, amount: number) {
  await signer.sendTransaction({ value: ethers.utils.parseEther(amount.toString()), to: to });

}

export const hashDescription = function(stringToHash: string) {
  const descriptionBytes = ethers.utils.toUtf8Bytes(stringToHash);
  return ethers.utils.keccak256(descriptionBytes);
}

export const getProposalData = async function(
  callDataArgs: { functionName: string, args: any[] },
  proposalArgs: { callAddresses: string[], msgValues: BigNumber[], description: string }

) {
  const governorInterface = await new ethers.utils.Interface(MyGovernorAbi);

  const callData = await governorInterface.encodeFunctionData(
    callDataArgs.functionName,
    callDataArgs.args
  );

  return [
    proposalArgs.callAddresses,
    proposalArgs.msgValues,
    [callData],
    proposalArgs.description
  ];
}

export const sendProposal = async function(
  callDataArgs: { functionName: string, args: any[] },
  proposalArgs: { callAddresses: string[], msgValues: BigNumber[], description: string },
  governor: Contract
) {
  const  firstProposal = await getProposalData(
    { functionName: callDataArgs.functionName, args: callDataArgs.args },
    { callAddresses: proposalArgs.callAddresses, msgValues: proposalArgs.msgValues, description: proposalArgs.description }
  );
  
  await governor.propose(
    ...firstProposal
  );

  const descriptionHash = hashDescription(firstProposal[3] as string);

  const firstProposalHash = await governor.hashProposal(
    firstProposal[0],
    firstProposal[1],
    firstProposal[2],
    descriptionHash
  );

  return firstProposalHash;
}

export const voteForFrom = async function(signer: SignerWithAddress, governor: Contract, proposalId: BigNumber) {

  governor = governor.connect(signer);
  
  const voteStart = await governor.proposalSnapshot(proposalId);
  const block = await ethers.provider.getBlock("latest");

  const blockToMine = block?.number ? voteStart - block.number + 1 : 0;

  if(blockToMine > 0) {
    await mineBlocks(blockToMine);
  }
  
  await governor.castVote(proposalId, 1);
}

export const getProposalStatetOf = async function(proposalId: BigNumber, governor: Contract) {
  const statut = await governor.state(proposalId);

  if(statut === 0) return "Pending";
  if(statut === 1) return "Active";
  if(statut === 2) return "Canceled";
  if(statut === 3) return "Defeated";
  if(statut === 4) return "Suceeded";
  if(statut === 5) return "Queued";
  if(statut === 6) return "Expired";
  if(statut === 7) return "Executed";
  return undefined;
}

export const goAfterVoteDeadline = async function(governor: Contract, proposalId: BigNumber) {
  const voteEnd = await governor.proposalDeadline(proposalId);
  const block = await ethers.provider.getBlock("latest");

  const blockToMine = block?.number ? voteEnd - block.number + 1 : 0;

  await mineBlocks(blockToMine);
}

export const setNewBlockTimestamp = async function(newBlockTimestamp: number) {
  await ethers.provider.send("evm_setNextBlockTimestamp", [newBlockTimestamp]);
}

export const mineBlock = async function() {
  await ethers.provider.send("evm_mine", []);
}

export const mineBlocks = async function(numberOfBlocks: number) {
  for(let i = 0; i < numberOfBlocks; i++) {
    await ethers.provider.send("evm_mine", []);
  }
}