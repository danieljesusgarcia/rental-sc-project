import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RentalContractData, ContractStatus } from 'types/rentalContract.types';
import { FormatAmount } from '@multiversx/sdk-dapp/UI';
import moment from 'moment';

interface ContractCardProps {
  contract: RentalContractData;
  onViewDetails?: () => void;
}

const getStatusLabel = (status: ContractStatus): { label: string; color: string } => {
  switch (status) {
    case ContractStatus.Pending:
      return { label: 'Pendent', color: 'status-pending' };
    case ContractStatus.Active:
      return { label: 'Actiu', color: 'status-active' };
    case ContractStatus.Completed:
      return { label: 'Completat', color: 'status-completed' };
    case ContractStatus.InDispute:
      return { label: 'En Disputa', color: 'status-dispute' };
    case ContractStatus.Finalized:
      return { label: 'Finalitzat', color: 'status-finalized' };
    default:
      return { label: 'Desconegut', color: 'status-finalized' };
  }
};

export const ContractCard: React.FC<ContractCardProps> = ({ contract, onViewDetails }) => {
  const status = getStatusLabel(contract.status);
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      navigate(`/contract/${contract.contractId}`);
    }
  };
  
  return (
    <div className='card p-6 hover-lift'>
      <div className='flex justify-between items-start mb-4'>
        <div>
          <h3 className='text-xl font-semibold text-primary'>Contract #{contract.contractId}</h3>
          <p className='text-muted text-sm mt-1'>{contract.contractReference}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div>
          <p className='text-sm text-muted'>Lloguer Mensual</p>
          <p className='text-lg font-semibold text-primary'>
            <FormatAmount value={contract.monthlyRent} decimals={18} egldLabel='EGLD' />
          </p>
        </div>
        <div>
          <p className='text-sm text-muted'>Fiança</p>
          <p className='text-lg font-semibold text-primary'>
            <FormatAmount value={contract.deposit} decimals={18} egldLabel='EGLD' />
          </p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 mb-4'>
        <div>
          <p className='text-sm text-muted'>Durada</p>
          <p className='font-medium text-secondary'>{contract.durationMonths} mesos</p>
        </div>
        <div>
          <p className='text-sm text-muted'>Pagaments</p>
          <p className='font-medium text-secondary'>{contract.paymentsMade} / {contract.totalPaymentsExpected}</p>
        </div>
      </div>

      {contract.startTimestamp > 0 && (
        <div className='border-t border-gray-200 pt-4 mt-4'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-muted'>Data d'Inici</p>
              <p className='font-medium text-secondary'>{moment.unix(contract.startTimestamp).format('DD/MM/YYYY')}</p>
            </div>
            <div>
              <p className='text-muted'>Data Final</p>
              <p className='font-medium text-secondary'>{moment.unix(contract.endTimestamp).format('DD/MM/YYYY')}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleViewDetails}
        className='mt-4 w-full btn btn-primary'
      >
        Veure Detalls
      </button>
    </div>
  );
};
