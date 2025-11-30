import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthRedirectWrapper } from 'wrappers';
import { useRentalContract } from 'hooks/useRentalContract';
import { ContractCard } from 'components/ContractCard';
import { RentalContractData } from 'types/rentalContract.types';

interface MyContractsProps {
  type: 'landlord' | 'tenant';
}

export const MyContracts: React.FC<MyContractsProps> = ({ type }) => {
  const navigate = useNavigate();
  const { getContractsByLandlord, getContractsByTenant, getContractDetails, userAddress } = useRentalContract();
  const [contracts, setContracts] = useState<RentalContractData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, [type, userAddress]);

  const loadContracts = async () => {
    if (!userAddress) return;
    
    setLoading(true);
    try {
      const contractIds = type === 'landlord' 
        ? await getContractsByLandlord(userAddress)
        : await getContractsByTenant(userAddress);

      const contractsData = await Promise.all(
        contractIds.map(id => getContractDetails(id))
      );

      setContracts(contractsData.filter(c => c !== null) as RentalContractData[]);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const title = type === 'landlord' ? 'Les Meves Propietats' : 'Els Meus Lloguers';
  const description = type === 'landlord' 
    ? 'Contractes on ets el propietari'
    : 'Contractes on ets el llogater';

  return (
    <AuthRedirectWrapper>
      <div className='flex flex-col gap-8 max-w-7xl mx-auto px-6 py-8'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-4xl font-semibold mb-2 text-primary'>{title}</h1>
            <p className='text-lg text-secondary'>{description}</p>
          </div>
          {type === 'landlord' && (
            <button
              onClick={() => navigate('/create')}
              className='btn btn-primary'
            >
              + Crear Contracte
            </button>
          )}
        </div>

        {loading ? (
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2'></div>
          </div>
        ) : contracts.length === 0 ? (
          <div className='card p-12 text-center'>
            <p className='text-gray-600 text-lg'>No s'han trobat contractes</p>
            {type === 'landlord' && (
              <button
                onClick={() => navigate('/create')}
                className='btn btn-primary mt-4'
              >
                Crea el teu primer contracte
              </button>
            )}
          </div>
        ) : (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {contracts.map((contract) => (
              <ContractCard
                key={contract.contractId}
                contract={contract}
                onViewDetails={() => navigate(`/contract/${contract.contractId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AuthRedirectWrapper>
  );
};
