import { OutputContainer } from 'components';
import { useCrowdfuningContract } from './crowdfundingApi';
import { formatAmount } from 'utils/sdkDappUtils';
import { formatDate } from './utils';
import { useGetAccount } from 'hooks';
import { useState } from 'react';
import { AuthRedirectWrapper } from 'wrappers';
import BigNumber from 'bignumber.js';

export const Crowdfunding = () => {
  const { address, balance } = useGetAccount();
  const { targetAmount, currentFunds, deadline, userDeposit, doDeposit } =
    useCrowdfuningContract(address, balance);
  const [depositAmount, setDepositAmount] = useState<string>('');

  const handleDeposit = () => {
    const denominatedAmount = new BigNumber(depositAmount).multipliedBy(
      new BigNumber(10).pow(18)
    );
    doDeposit(BigInt(denominatedAmount.toFixed(0)));
  };

  return (
    <AuthRedirectWrapper>
      <div className='rounded-xl bg-white p-6 text-center w-2/3'>
        <h1 className='text-xl'>CROWDFUNDING</h1>
        <p className='text-gray-400 mb-6'>
          Crowdfunding per recaptar diners per fer una implantació de blockchain
          per gestionar els expedients acadèmics dels alumnes d'institut
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <OutputContainer>
            <h2 className='text-lg'>DINERS A RECAPTAR</h2>
            <h3 className='text-lg'>
              {formatAmount({
                input: targetAmount.toString(),
                digits: 3
              })}{' '}
              EGLD
            </h3>
          </OutputContainer>
          <OutputContainer>
            <h2 className='text-lg'>DINERS RECAPTATS</h2>
            <h3 className='text-lg'>
              {formatAmount({
                input: currentFunds.toString(),
                digits: 3
              })}{' '}
              EGLD
            </h3>
          </OutputContainer>
          <OutputContainer>
            <h2 className='text-lg'>DATA LÍMIT</h2>
            <h3 className='text-lg'>{formatDate(deadline)}</h3>
          </OutputContainer>
        </div>
        <div className='grid grid-cols-3 gap-4 mt-3'>
          <OutputContainer>
            <h2 className='text-lg'>EL MEU DIPÒSIT</h2>
            <h3 className='text-lg'>
              {userDeposit
                ? formatAmount({
                    input: userDeposit.toString(),
                    digits: 3
                  })
                : ' - '}
              {' EGLD'}
            </h3>
          </OutputContainer>
          <OutputContainer className='col-span-2'>
            <div className='flex items-center gap-4 p-5'>
              <input
                type='number'
                min='0'
                step='0.01'
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder='Cantidad en EGLD'
                className='w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <button
                onClick={() => handleDeposit()}
                className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition'
              >
                Dipositar
              </button>
            </div>
          </OutputContainer>
        </div>
      </div>
    </AuthRedirectWrapper>
  );
};
