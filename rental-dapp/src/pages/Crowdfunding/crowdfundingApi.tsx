import { useGetNetworkConfig } from 'hooks';
import {
  Address,
  AddressValue,
  ContractFunction,
  ProxyNetworkProvider,
  ResultsParser
} from 'utils';
import { abi, smartContract } from './crowdfundingSmartContract';
import { useEffect, useState } from 'react';
import {
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig
} from '@multiversx/sdk-core/out';
import { crowdfundingContractAddress } from 'config';
import { signAndSendTransactions } from 'helpers';

const resultsParser = new ResultsParser();

const PONG_TRANSACTION_INFO = {
  processingMessage: 'Fent un dipòsit',
  errorMessage: 'Error en fer el dipòsit',
  successMessage: 'Dipòsit realitzat correctament'
};

export const useCrowdfuningContract = (
  userAddress: string,
  balance: string
) => {
  const { network } = useGetNetworkConfig();
  const proxy = new ProxyNetworkProvider(network.apiAddress);
  const [targetAmount, setTargetAmount] = useState<BigInt>(BigInt(0));
  const [currentFunds, setCurrentFunds] = useState<BigInt>(BigInt(0));
  const [deadline, setDeadline] = useState<string>('');
  const [userDeposit, setUserDeposit] = useState<BigInt>(BigInt(0));

  const getTargetAmount = async () => {
    try {
      const query = smartContract.createQuery({
        func: new ContractFunction('getTarget')
      });
      const queryResponse = await proxy.queryContract(query);

      const endpointDefinition = smartContract.getEndpoint('getTarget');

      const { firstValue: amount } = resultsParser.parseQueryResponse(
        queryResponse,
        endpointDefinition
      );

      setTargetAmount(amount?.valueOf());
    } catch (err) {
      console.error('Unable to call getTarget', err);
    }
  };

  const getCurrentFunds = async () => {
    try {
      const query = smartContract.createQuery({
        func: new ContractFunction('getCurrentFunds')
      });
      const queryResponse = await proxy.queryContract(query);

      const endpointDefinition = smartContract.getEndpoint('getCurrentFunds');

      const { firstValue: amount } = resultsParser.parseQueryResponse(
        queryResponse,
        endpointDefinition
      );

      setCurrentFunds(amount?.valueOf());
    } catch (err) {
      console.error('Unable to call getCurrentFunds', err);
    }
  };

  const getDeadline = async () => {
    try {
      const query = smartContract.createQuery({
        func: new ContractFunction('getDeadline')
      });
      const queryResponse = await proxy.queryContract(query);

      const endpointDefinition = smartContract.getEndpoint('getDeadline');

      const { firstValue: deadline } = resultsParser.parseQueryResponse(
        queryResponse,
        endpointDefinition
      );

      setDeadline(deadline?.valueOf().toFixed());
    } catch (err) {
      console.error('Unable to call getDeadline', err);
    }
  };

  const getUserDeposit = async () => {
    if (!userAddress) {
      return 0;
    }
    try {
      const query = smartContract.createQuery({
        func: new ContractFunction('getDeposit'),
        args: [new AddressValue(new Address(userAddress))]
      });
      const queryResponse = await proxy.queryContract(query);

      const endpointDefinition = smartContract.getEndpoint('getDeposit');

      const { firstValue: deposit } = resultsParser.parseQueryResponse(
        queryResponse,
        endpointDefinition
      );

      setUserDeposit(deposit?.valueOf());
    } catch (err) {
      console.error('Unable to call getDeposit', err);
    }
  };

  const doDeposit = async (amount: BigInt) => {
    if (!userAddress) {
      console.error('No user address');
      return;
    }

    const factoryConfig = new TransactionsFactoryConfig({
      chainID: network.chainId
    });

    let factory = new SmartContractTransactionsFactory({
      config: factoryConfig,
      abi
    });

    const transaction = factory.createTransactionForExecute({
      sender: new Address(userAddress),
      contract: new Address(crowdfundingContractAddress),
      function: 'fund',
      gasLimit: BigInt(10000000),
      arguments: [],
      nativeTransferAmount: amount.valueOf()
    });

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      callbackRoute: '',
      transactionsDisplayInfo: PONG_TRANSACTION_INFO
    });
  };

  useEffect(() => {
    getTargetAmount();
    getCurrentFunds();
    getDeadline();
    getUserDeposit();
  }, [balance]);

  return {
    targetAmount,
    currentFunds,
    deadline,
    userDeposit,
    doDeposit
  };
};
