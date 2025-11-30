import { crowdfundingContractAddress } from 'config';
import json from 'contracts/crowdfunding-sc.abi.json';
import { AbiRegistry, Address, SmartContract } from '../../utils/sdkDappCore';

export const abi = AbiRegistry.create(json);

export const smartContract = new SmartContract({
  address: new Address(crowdfundingContractAddress),
  abi
});
