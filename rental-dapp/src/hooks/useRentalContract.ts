import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import { 
  Address, 
  U64Value, 
  StringValue,
  BigUIntValue,
  ContractFunction,
  ResultsParser,
  AbiRegistry
} from '@multiversx/sdk-core';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { SmartContract } from '@multiversx/sdk-core';
import { rentalContractAddress, API_URL } from 'config';
import rentalContractAbiJson from 'contracts/rental-contract.abi.json';
import { 
  RentalContractData, 
  CreateContractParams,
  DepositDecision,
  PaymentStatus,
  ContractStatus 
} from 'types/rentalContract.types';

const CONTRACT_GAS_LIMIT = 60000000;
const proxy = new ProxyNetworkProvider(API_URL);

export const useRentalContract = () => {
  const { address: userAddress } = useGetAccountInfo();

  const abiRegistry = AbiRegistry.create(rentalContractAbiJson);
  const contract = new SmartContract({
    address: new Address(rentalContractAddress),
    abi: abiRegistry
  });

  const createRentalContract = async (params: CreateContractParams) => {
    if (!userAddress) {
      throw new Error('Usuari no connectat');
    }

    const tx = contract.methods
      .createRentalContract([
        new Address(params.tenant),
        new BigUIntValue(params.depositAmount),
        new BigUIntValue(params.monthlyRent),
        new U64Value(params.durationMonths),
        new StringValue(params.contractReference)
      ])
      .withSender(new Address(userAddress))
      .withGasLimit(CONTRACT_GAS_LIMIT)
      .withChainID('D')
      .buildTransaction();

    await refreshAccount();

    const { sessionId } = await sendTransactions({
      transactions: [tx],
      transactionsDisplayInfo: {
        processingMessage: 'Creant contracte de lloguer...',
        errorMessage: 'Error creant el contracte',
        successMessage: 'Contracte creat correctament'
      }
    });

    return sessionId;
  };

  const acceptContract = async (contractId: number, depositAmount: string) => {
    if (!userAddress) {
      throw new Error('Usuari no connectat');
    }

    console.log('acceptContract called with:', { contractId, depositAmount, userAddress });

    const tx = contract.methods
      .acceptContract([new U64Value(contractId)])
      .withSender(new Address(userAddress))
      .withValue(depositAmount)
      .withGasLimit(CONTRACT_GAS_LIMIT)
      .withChainID('D')
      .buildTransaction();

    console.log('Transaction built:', tx);

    await refreshAccount();

    const { sessionId } = await sendTransactions({
      transactions: [tx],
      transactionsDisplayInfo: {
        processingMessage: 'Acceptant contracte i pagant fiança...',
        errorMessage: 'Error acceptant el contracte',
        successMessage: 'Contracte acceptat correctament'
      }
    });

    console.log('Transaction sent, sessionId:', sessionId);

    return sessionId;
  };

  const makePayment = async (contractId: number, paymentAmount: string) => {
    if (!userAddress) {
      throw new Error('Usuari no connectat');
    }

    const tx = contract.methods
      .makePayment([new U64Value(contractId)])
      .withSender(new Address(userAddress))
      .withValue(paymentAmount)
      .withGasLimit(CONTRACT_GAS_LIMIT)
      .withChainID('D')
      .buildTransaction();

    await refreshAccount();

    const { sessionId } = await sendTransactions({
      transactions: [tx],
      transactionsDisplayInfo: {
        processingMessage: 'Realitzant pagament del lloguer...',
        errorMessage: 'Error realitzant el pagament',
        successMessage: 'Pagament realitzat correctament'
      }
    });

    return sessionId;
  };

  const landlordDecision = async (contractId: number, returnDeposit: boolean) => {
    if (!userAddress) {
      throw new Error('Usuari no connectat');
    }

    const tx = contract.methods
      .landlordDecision([
        new U64Value(contractId),
        returnDeposit
      ])
      .withSender(new Address(userAddress))
      .withGasLimit(CONTRACT_GAS_LIMIT)
      .withChainID('D')
      .buildTransaction();

    await refreshAccount();

    const { sessionId } = await sendTransactions({
      transactions: [tx],
      transactionsDisplayInfo: {
        processingMessage: 'Enviant decisió del propietari...',
        errorMessage: 'Error enviant la decisió',
        successMessage: 'Decisió enviada correctament'
      }
    });

    return sessionId;
  };

  const tenantDecision = async (contractId: number, returnDeposit: boolean) => {
    if (!userAddress) {
      throw new Error('Usuari no connectat');
    }

    const tx = contract.methods
      .tenantDecision([
        new U64Value(contractId),
        returnDeposit
      ])
      .withSender(new Address(userAddress))
      .withGasLimit(CONTRACT_GAS_LIMIT)
      .withChainID('D')
      .buildTransaction();

    await refreshAccount();

    const { sessionId } = await sendTransactions({
      transactions: [tx],
      transactionsDisplayInfo: {
        processingMessage: 'Enviant decisió del llogater...',
        errorMessage: 'Error enviant la decisió',
        successMessage: 'Decisió enviada correctament'
      }
    });

    return sessionId;
  };

  const getContractDetails = async (contractId: number): Promise<RentalContractData | null> => {
    try {
      const interaction = contract.methods.getContractDetails([new U64Value(contractId)]);
      const query = interaction.buildQuery();
      const queryResponse = await proxy.queryContract(query);
      const endpointDefinition = interaction.getEndpoint();
      const resultsParser = new ResultsParser();
      const bundle = resultsParser.parseQueryResponse(queryResponse, endpointDefinition);
      
      if (!bundle.returnCode.isSuccess()) {
        console.error('Query failed:', bundle.returnCode);
        return null;
      }

      // Obtenir tots els valors (multi-value return)
      const values = bundle.values;
      console.log('All values:', values);
      console.log('Values length:', values.length);
      
      if (values.length < 11) {
        console.error('Not enough values returned:', values.length);
        return null;
      }
      
      // Helper per convertir adreces
      const parseAddress = (addr: any): string => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        const val = addr.valueOf ? addr.valueOf() : addr;
        if (val && val.bech32 && typeof val.bech32 === 'function') return val.bech32();
        if (val && val.toString && typeof val.toString === 'function') return val.toString();
        return '';
      };
      
      return {
        contractId,
        landlord: parseAddress(values[0]),
        tenant: parseAddress(values[1]),
        deposit: values[2]?.valueOf()?.toString() || '0',
        monthlyRent: values[3]?.valueOf()?.toString() || '0',
        durationMonths: Number(values[4]?.valueOf() || 0),
        contractReference: values[5]?.valueOf() ? Buffer.from(values[5].valueOf()).toString('utf-8') : '',
        startTimestamp: Number(values[6]?.valueOf() || 0),
        endTimestamp: Number(values[7]?.valueOf() || 0),
        paymentsMade: Number(values[8]?.valueOf() || 0),
        totalPaymentsExpected: Number(values[9]?.valueOf() || 0),
        status: Number(values[10]?.valueOf() || 0) as ContractStatus
      };
    } catch (error) {
      console.error('Error fetching contract details:', error);
      return null;
    }
  };

  const getContractsByLandlord = async (landlordAddress: string): Promise<number[]> => {
    try {
      const interaction = contract.methods.getContractsByLandlord([new Address(landlordAddress)]);
      const query = interaction.buildQuery();
      const queryResponse = await proxy.queryContract(query);
      const endpointDefinition = interaction.getEndpoint();
      const resultsParser = new ResultsParser();
      const { firstValue, returnCode } = resultsParser.parseQueryResponse(queryResponse, endpointDefinition);
      
      if (!returnCode.isSuccess()) {
        console.error('Query failed:', returnCode);
        return [];
      }

      const values = firstValue?.valueOf();
      if (!values || !Array.isArray(values)) return [];
      
      return values.map((v: any) => Number(v));
    } catch (error) {
      console.error('Error fetching landlord contracts:', error);
      return [];
    }
  };

  const getContractsByTenant = async (tenantAddress: string): Promise<number[]> => {
    try {
      const interaction = contract.methods.getContractsByTenant([new Address(tenantAddress)]);
      const query = interaction.buildQuery();
      const queryResponse = await proxy.queryContract(query);
      const endpointDefinition = interaction.getEndpoint();
      const resultsParser = new ResultsParser();
      const { firstValue, returnCode } = resultsParser.parseQueryResponse(queryResponse, endpointDefinition);
      
      if (!returnCode.isSuccess()) {
        console.error('Query failed:', returnCode);
        return [];
      }

      const values = firstValue?.valueOf();
      if (!values || !Array.isArray(values)) return [];
      
      return values.map((v: any) => Number(v));
    } catch (error) {
      console.error('Error fetching tenant contracts:', error);
      return [];
    }
  };

  const getDepositDecisionDetails = async (contractId: number): Promise<DepositDecision | null> => {
    try {
      const interaction = contract.methods.getDepositDecisionDetails([new U64Value(contractId)]);
      const query = interaction.buildQuery();
      const queryResponse = await proxy.queryContract(query);
      const endpointDefinition = interaction.getEndpoint();
      const resultsParser = new ResultsParser();
      const bundle = resultsParser.parseQueryResponse(queryResponse, endpointDefinition);
      
      if (!bundle.returnCode.isSuccess()) {
        console.error('Query failed:', bundle.returnCode);
        return null;
      }

      const values = bundle.values;
      console.log('Deposit decision values:', values);
      console.log('Values length:', values.length);
      
      if (values.length < 4) {
        console.error('Not enough values for deposit decision:', values.length);
        return null;
      }
      
      const result = {
        landlordDecided: Number(values[0]?.valueOf() || 0) === 1,
        landlordWantsReturn: Number(values[1]?.valueOf() || 0) === 1,
        tenantDecided: Number(values[2]?.valueOf() || 0) === 1,
        tenantWantsReturn: Number(values[3]?.valueOf() || 0) === 1
      };
      
      console.log('Parsed deposit decision:', result);
      
      return result;
    } catch (error) {
      console.error('Error fetching deposit decision:', error);
      return null;
    }
  };

  const getPaymentsStatus = async (contractId: number): Promise<PaymentStatus | null> => {
    try {
      const interaction = contract.methods.getPaymentsStatus([new U64Value(contractId)]);
      const query = interaction.buildQuery();
      const queryResponse = await proxy.queryContract(query);
      const endpointDefinition = interaction.getEndpoint();
      const resultsParser = new ResultsParser();
      const { firstValue, returnCode } = resultsParser.parseQueryResponse(queryResponse, endpointDefinition);
      
      if (!returnCode.isSuccess()) {
        console.error('Query failed:', returnCode);
        return null;
      }

      const values = firstValue?.valueOf();
      if (!values) return null;
      
      return {
        paymentsMade: Number(values[0]),
        totalPaymentsExpected: Number(values[1])
      };
    } catch (error) {
      console.error('Error fetching payment status:', error);
      return null;
    }
  };

  return {
    createRentalContract,
    acceptContract,
    makePayment,
    landlordDecision,
    tenantDecision,
    getContractDetails,
    getContractsByLandlord,
    getContractsByTenant,
    getDepositDecisionDetails,
    getPaymentsStatus,
    userAddress
  };
};
