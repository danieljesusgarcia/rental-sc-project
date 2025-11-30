import React from 'react';
import { AuthRedirectWrapper } from 'wrappers';
import { CreateContractForm } from 'components/CreateContractForm';

export const CreateContract: React.FC = () => {
  return (
    <AuthRedirectWrapper>
      <div className='flex flex-col gap-8 max-w-4xl mx-auto px-6 py-8'>
        <div className='text-center'>
          <h1 className='text-4xl font-semibold mb-3 text-primary'>Crear Contracte de Lloguer</h1>
          <p className='text-lg text-secondary'>
            Crea un nou acord de lloguer a la blockchain
          </p>
        </div>
        
        <CreateContractForm />
      </div>
    </AuthRedirectWrapper>
  );
};
