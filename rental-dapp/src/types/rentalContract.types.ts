export enum ContractStatus {
  Pending = 0,
  Active = 1,
  Completed = 2,
  InDispute = 3,
  Finalized = 4
}

export interface RentalContractData {
  contractId: number;
  landlord: string;
  tenant: string;
  deposit: string;
  monthlyRent: string;
  durationMonths: number;
  contractReference: string;
  startTimestamp: number;
  endTimestamp: number;
  paymentsMade: number;
  totalPaymentsExpected: number;
  status: ContractStatus;
}

export interface DepositDecision {
  landlordDecided: boolean;
  landlordWantsReturn: boolean;
  tenantDecided: boolean;
  tenantWantsReturn: boolean;
}

export interface CreateContractParams {
  tenant: string;
  depositAmount: string;
  monthlyRent: string;
  durationMonths: number;
  contractReference: string;
}

export interface PaymentStatus {
  paymentsMade: number;
  totalPaymentsExpected: number;
}
