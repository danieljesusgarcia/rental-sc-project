import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthRedirectWrapper } from 'wrappers';
import { useRentalContract } from 'hooks/useRentalContract';
import { ContractCard } from 'components/ContractCard';
import { RentalContractData } from 'types/rentalContract.types';

export const AllContracts: React.FC = () => {
  const navigate = useNavigate();
  const { getContractsByLandlord, getContractsByTenant, getContractDetails, userAddress } = useRentalContract();
  const [contracts, setContracts] = useState<RentalContractData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllContracts();
  }, [userAddress]);

  const loadAllContracts = async () => {
    if (!userAddress) return;
    
    setLoading(true);
    try {
      // Carregar contractes com a propietari
      const landlordContractIds = await getContractsByLandlord(userAddress);
      const landlordContracts = await Promise.all(
        landlordContractIds.map(id => getContractDetails(id))
      );

      // Carregar contractes com a llogater
      const tenantContractIds = await getContractsByTenant(userAddress);
      const tenantContracts = await Promise.all(
        tenantContractIds.map(id => getContractDetails(id))
      );

      // Combinar i eliminar duplicats (per si de cas)
      const allContracts = [...landlordContracts, ...tenantContracts];
      const uniqueContracts = allContracts.filter(
        (contract, index, self) => 
          contract && self.findIndex(c => c?.contractId === contract.contractId) === index
      );

      setContracts(uniqueContracts.filter(c => c !== null) as RentalContractData[]);
    } catch (error) {
      console.error('Error loading all contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthRedirectWrapper>
      <div className='flex flex-col gap-8 max-w-7xl mx-auto px-6 py-8'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-4xl font-semibold mb-2 text-primary'>Tots els Contractes</h1>
            <p className='text-lg text-secondary'>Visualitza tots els teus contractes de lloguer (com a propietari i llogater)</p>
          </div>
          <button
            onClick={() => navigate('/create')}
            className='btn btn-primary'
          >
            + Crear Contracte
          </button>
        </div>

        {loading ? (
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2'></div>
          </div>
        ) : contracts.length === 0 ? (
          <div className='card p-12 text-center'>
            <p className='text-gray-600 text-lg'>No s'han trobat contractes</p>
            <button
              onClick={() => navigate('/create')}
              className='btn btn-primary mt-4'
            >
              Crea el teu primer contracte
            </button>
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
