import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormatAmount } from '@multiversx/sdk-dapp/UI/FormatAmount';
import { useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks/transactions/useGetPendingTransactions';
import { useRentalContract } from 'hooks/useRentalContract';
import { RentalContractData, ContractStatus } from 'types/rentalContract.types';
import moment from 'moment';

export const ContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getContractDetails, acceptContract, makePayment, landlordDecision, tenantDecision, getDepositDecisionDetails, userAddress } = useRentalContract();
  const { hasPendingTransactions } = useGetPendingTransactions();
  const [contract, setContract] = useState<RentalContractData | null>(null);
  const [depositDecisions, setDepositDecisions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastTxPending, setLastTxPending] = useState(false);

  const loadContract = async () => {
    if (!id) return;
    
    setLoading(true);
    const contractData = await getContractDetails(parseInt(id));
    setContract(contractData);
    
    // Si el contracte està completat o finalitzat, carregar les decisions del dipòsit
    if (contractData && (contractData.status === ContractStatus.Completed || 
                         contractData.status === ContractStatus.InDispute ||
                         contractData.status === ContractStatus.Finalized)) {
      const decisions = await getDepositDecisionDetails(contractData.contractId);
      setDepositDecisions(decisions);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadContract();
  }, [id]);

  // Recarregar quan es completen les transaccions
  useEffect(() => {
    if (lastTxPending && !hasPendingTransactions) {
      // Les transaccions pendents s'han completat
      console.log('Transactions completed, reloading contract details...');
      setTimeout(() => {
        loadContract();
        setProcessing(false);
      }, 1000); // Petit delay per assegurar que el blockchain s'ha actualitzat
    }
    setLastTxPending(hasPendingTransactions);
  }, [hasPendingTransactions, lastTxPending]);

  const handleAcceptContract = async () => {
    if (!contract || processing) return;
    
    try {
      setProcessing(true);
      console.log('Accepting contract with deposit:', contract.deposit);
      // contract.deposit ja està en wei (string), no cal convertir
      await acceptContract(contract.contractId, contract.deposit);
      // El useEffect amb hasPendingTransactions s'encarregarà de recarregar
    } catch (error) {
      console.error('Error accepting contract:', error);
      setProcessing(false);
    }
  };

  const handleMakePayment = async () => {
    if (!contract || processing) return;
    
    try {
      setProcessing(true);
      console.log('Making payment with amount:', contract.monthlyRent);
      // contract.monthlyRent ja està en wei (string), no cal convertir
      await makePayment(contract.contractId, contract.monthlyRent);
      // El useEffect amb hasPendingTransactions s'encarregarà de recarregar
    } catch (error) {
      console.error('Error making payment:', error);
      setProcessing(false);
    }
  };

  const handleLandlordDecision = async (returnDeposit: boolean) => {
    if (!contract || processing) return;
    
    try {
      setProcessing(true);
      console.log('Landlord decision:', returnDeposit ? 'Return deposit' : 'Keep deposit');
      await landlordDecision(contract.contractId, returnDeposit);
      // El useEffect amb hasPendingTransactions s'encarregarà de recarregar
    } catch (error) {
      console.error('Error submitting landlord decision:', error);
      setProcessing(false);
    }
  };

  const handleTenantDecision = async (returnDeposit: boolean) => {
    if (!contract || processing) return;
    
    try {
      setProcessing(true);
      console.log('Tenant decision:', returnDeposit ? 'Request return' : 'Forfeit deposit');
      await tenantDecision(contract.contractId, returnDeposit);
      // El useEffect amb hasPendingTransactions s'encarregarà de recarregar
    } catch (error) {
      console.error('Error submitting tenant decision:', error);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-lg'>Carregant detalls del contracte...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen'>
        <h2 className='text-2xl font-bold mb-4'>Contracte No Trobat</h2>
        <p className='text-gray-600 mb-6'>El contracte que cerques no existeix.</p>
        <button
          onClick={() => navigate(-1)}
          className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
        >
          Tornar
        </button>
      </div>
    );
  }

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.Pending:
        return 'bg-yellow-100 text-yellow-800';
      case ContractStatus.Active:
        return 'bg-green-100 text-green-800';
      case ContractStatus.Completed:
        return 'bg-blue-100 text-blue-800';
      case ContractStatus.InDispute:
        return 'bg-red-100 text-red-800';
      case ContractStatus.Finalized:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.Pending:
        return 'Pendent';
      case ContractStatus.Active:
        return 'Actiu';
      case ContractStatus.Completed:
        return 'Completat';
      case ContractStatus.InDispute:
        return 'En Disputa';
      case ContractStatus.Finalized:
        return 'Finalitzat';
      default:
        return 'Desconegut';
    }
  };

  const isLandlord = userAddress === contract.landlord;
  const isTenant = userAddress === contract.tenant;

  console.log('User address:', userAddress);
  console.log('Contract landlord:', contract.landlord);
  console.log('Contract tenant:', contract.tenant);
  console.log('Is landlord?', isLandlord);
  console.log('Is tenant?', isTenant);
  console.log('Contract status:', contract.status, ContractStatus[contract.status]);

  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      <button
        onClick={() => navigate(-1)}
        className='mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2'
      >
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
        </svg>
        Enrere
      </button>

      <div className='card p-8'>
        <div className='flex justify-between items-start mb-6'>
          <div>
            <h1 className='text-3xl font-bold mb-2'>Contract #{contract.contractId}</h1>
            <p className='text-gray-600'>{contract.contractReference}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(contract.status)}`}>
            {getStatusText(contract.status)}
          </span>
        </div>

        {/* Parties Information */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          <div className='p-4 bg-gray-50 rounded-lg'>
            <h3 className='font-semibold mb-2 flex items-center gap-2'>
              <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} 
                      d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
              </svg>
              Propietari
              {isLandlord && <span className='text-xs text-green-600'>(Tu)</span>}
            </h3>
            <p className='text-sm font-mono break-all'>{contract.landlord}</p>
          </div>

          <div className='p-4 bg-gray-50 rounded-lg'>
            <h3 className='font-semibold mb-2 flex items-center gap-2'>
              <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} 
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
              Llogater
              {isTenant && <span className='text-xs text-purple-600'>(Tu)</span>}
            </h3>
            <p className='text-sm font-mono break-all'>{contract.tenant}</p>
          </div>
        </div>

        {/* Financial Information */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          <div>
            <h3 className='text-sm text-gray-600 mb-1'>Import de la Fiança</h3>
            <div className='text-2xl font-bold'>
              <FormatAmount value={contract.deposit} decimals={18} egldLabel='EGLD' />
            </div>
          </div>

          <div>
            <h3 className='text-sm text-gray-600 mb-1'>Lloguer Mensual</h3>
            <div className='text-2xl font-bold'>
              <FormatAmount value={contract.monthlyRent} decimals={18} egldLabel='EGLD' />
            </div>
          </div>
        </div>

        {/* Contract Timeline */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold mb-4'>Cronologia</h3>
          <div className='space-y-3'>
            <div className='flex justify-between items-center p-3 bg-gray-50 rounded'>
              <span className='text-gray-600'>Durada</span>
              <span className='font-semibold'>{contract.durationMonths} mesos</span>
            </div>

            {contract.startTimestamp > 0 && (
              <div className='flex justify-between items-center p-3 bg-gray-50 rounded'>
                <span className='text-gray-600'>Data d'Inici</span>
                <span className='font-semibold'>
                  {moment.unix(contract.startTimestamp).format('D MMM, YYYY')}
                </span>
              </div>
            )}

            {contract.endTimestamp > 0 && (
              <div className='flex justify-between items-center p-3 bg-gray-50 rounded'>
                <span className='text-gray-600'>Data Final</span>
                <span className='font-semibold'>
                  {moment.unix(contract.endTimestamp).format('D MMM, YYYY')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Progress */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold mb-4'>Progrés de Pagaments</h3>
          <div className='space-y-3'>
            <div className='flex justify-between items-center p-3 bg-gray-50 rounded'>
              <span className='text-gray-600'>Pagaments Realitzats</span>
              <span className='font-semibold'>
                {contract.paymentsMade} / {contract.totalPaymentsExpected}
              </span>
            </div>

            {/* Progress Bar */}
            <div className='w-full bg-gray-200 rounded-full h-4'>
              <div
                className='bg-blue-600 h-4 rounded-full transition-all'
                style={{
                  width: `${(contract.paymentsMade / contract.totalPaymentsExpected) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {contract.status === ContractStatus.Pending && isTenant && (
          <div className='mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <h3 className='font-semibold mb-2'>Acció Requerida</h3>
            <p className='text-sm text-gray-600 mb-4'>
              Has d'acceptar aquest contracte i pagar la fiança de{' '}
              <FormatAmount value={contract.deposit} decimals={18} egldLabel='EGLD' className='font-semibold' />
            </p>
            <button 
              onClick={handleAcceptContract}
              disabled={processing}
              className='w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed'
            >
              {processing ? 'Processant...' : 'Acceptar Contracte i Pagar Fiança'}
            </button>
          </div>
        )}

        {contract.status === ContractStatus.Active && isTenant && (
          <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <h3 className='font-semibold mb-2'>Fer Pagament Mensual</h3>
            <p className='text-sm text-gray-600 mb-4'>
              Paga el teu lloguer mensual de{' '}
              <FormatAmount value={contract.monthlyRent} decimals={18} egldLabel='EGLD' className='font-semibold' />
            </p>
            <button 
              onClick={handleMakePayment}
              disabled={processing}
              className='w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed'
            >
              {processing ? 'Processant...' : 'Fer Pagament'}
            </button>
          </div>
        )}

        {contract.status === ContractStatus.Completed && isLandlord && (
          <div className='mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg'>
            <h3 className='font-semibold mb-2'>Decisió sobre la Fiança Requerida</h3>
            <p className='text-sm text-gray-600 mb-4'>
              El període de lloguer ha finalitzat. Decideix si retornar la fiança al llogater.
            </p>
            <div className='grid grid-cols-2 gap-4'>
              <button 
                onClick={() => handleLandlordDecision(true)}
                disabled={processing}
                className='py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {processing ? 'Processant...' : 'Retornar Fiança'}
              </button>
              <button 
                onClick={() => handleLandlordDecision(false)}
                disabled={processing}
                className='py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {processing ? 'Processant...' : 'Quedar-se Fiança'}
              </button>
            </div>
          </div>
        )}

        {contract.status === ContractStatus.Completed && isTenant && (
          <div className='mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg'>
            <h3 className='font-semibold mb-2'>Decisió sobre la Fiança Requerida</h3>
            <p className='text-sm text-gray-600 mb-4'>
              El període de lloguer ha finalitzat. Indica si esperes recuperar la teva fiança.
            </p>
            <div className='grid grid-cols-2 gap-4'>
              <button 
                onClick={() => handleTenantDecision(true)}
                disabled={processing}
                className='py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {processing ? 'Processant...' : 'Sol·licitar Retorn'}
              </button>
              <button 
                onClick={() => handleTenantDecision(false)}
                disabled={processing}
                className='py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {processing ? 'Processant...' : 'Renunciar a Fiança'}
              </button>
            </div>
          </div>
        )}

        {contract.status === ContractStatus.InDispute && (
          <div className='mt-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <h3 className='font-semibold mb-2 text-red-800'>Contracte en Disputa</h3>
            <p className='text-sm text-gray-600'>
              Hi ha un desacord sobre el retorn de la fiança. Ambdues parts han presentat decisions diferents.
              Això requereix una resolució manual.
            </p>
          </div>
        )}

        {contract.status === ContractStatus.Finalized && depositDecisions && (
          <div className='mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
            <h3 className='font-semibold mb-2'>Contracte Finalitzat</h3>
            <p className='text-sm text-gray-600 mb-4'>
              Aquest contracte ha estat completat i tots els fons han estat distribuïts.
            </p>
            
            <div className='bg-white p-4 rounded border border-gray-200'>
              <h4 className='font-semibold mb-3'>Resolució Final:</h4>
              
              {depositDecisions.landlordWantsReturn && depositDecisions.tenantWantsReturn ? (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-green-700'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <span className='font-medium'>Fiança retornada al llogater</span>
                  </div>
                  <p className='text-sm text-gray-600 ml-7'>
                    Ambdues parts van acordar que la fiança de{' '}
                    <FormatAmount value={contract.deposit} decimals={18} egldLabel='EGLD' className='font-semibold' />{' '}
                    havia de ser retornada al llogater.
                  </p>
                </div>
              ) : !depositDecisions.landlordWantsReturn && !depositDecisions.tenantWantsReturn ? (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-blue-700'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <span className='font-medium'>Fiança retinguda pel propietari</span>
                  </div>
                  <p className='text-sm text-gray-600 ml-7'>
                    Ambdues parts van acordar que la fiança de{' '}
                    <FormatAmount value={contract.deposit} decimals={18} egldLabel='EGLD' className='font-semibold' />{' '}
                    havia de ser retinguda pel propietari.
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-orange-700'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                    </svg>
                    <span className='font-medium'>Disputa resolta</span>
                  </div>
                  <p className='text-sm text-gray-600 ml-7'>
                    Les parts no estaven d'acord sobre el retorn de la fiança. La disputa ha estat resolta i la fiança de{' '}
                    <FormatAmount value={contract.deposit} decimals={18} egldLabel='EGLD' className='font-semibold' />{' '}
                    ha estat distribuïda segons la resolució.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
