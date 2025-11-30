import {
  type ExtensionLoginButtonPropsType,
  type WebWalletLoginButtonPropsType,
  type OperaWalletLoginButtonPropsType,
  type LedgerLoginButtonPropsType,
  type WalletConnectLoginButtonPropsType
} from '@multiversx/sdk-dapp/UI';
import {
  ExtensionLoginButton,
  LedgerLoginButton,
  OperaWalletLoginButton,
  WalletConnectLoginButton,
  WebWalletLoginButton as WebWalletUrlLoginButton,
  CrossWindowLoginButton
} from 'components/sdkDappComponents';
import { nativeAuth } from 'config';
import { RouteNamesEnum } from 'localConstants';
import { useNavigate } from 'react-router-dom';
import { AuthRedirectWrapper } from 'wrappers';
import {
  IframeButton,
  WebWalletLoginWrapper,
  XaliasLoginWrapper
} from './components';
import { IframeLoginTypes } from '@multiversx/sdk-web-wallet-iframe-provider/out/constants';
import { useIframeLogin } from '@multiversx/sdk-dapp/hooks/login/useIframeLogin';
import { useWindowSize } from 'hooks';

type CommonPropsType =
  | OperaWalletLoginButtonPropsType
  | ExtensionLoginButtonPropsType
  | WebWalletLoginButtonPropsType
  | LedgerLoginButtonPropsType
  | WalletConnectLoginButtonPropsType;

// choose how you want to configure connecting to the web wallet
const USE_WEB_WALLET_CROSS_WINDOW = true;

const WebWalletLoginButton = USE_WEB_WALLET_CROSS_WINDOW
  ? CrossWindowLoginButton
  : WebWalletUrlLoginButton;

export const Unlock = () => {
  const navigate = useNavigate();
  const { width } = useWindowSize();

  const [onInitiateLogin, { isLoading }] = useIframeLogin({
    callbackRoute: RouteNamesEnum.dashboard,
    nativeAuth,
    onLoginRedirect: () => {
      navigate(RouteNamesEnum.dashboard);
    }
  });

  const isMobile = width < 768;
  const commonProps: CommonPropsType = {
    callbackRoute: RouteNamesEnum.dashboard,
    nativeAuth,
    onLoginRedirect: () => {
      navigate(RouteNamesEnum.dashboard);
    },
    disabled: isLoading
  };

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <div className='flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
        <div className='max-w-md w-full mx-4'>
          <div
            className='flex flex-col p-8 items-center justify-center gap-6 rounded-2xl bg-white shadow-xl'
            data-testid='unlockPage'
          >
            {/* Logo/Icon */}
            <div className='w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center'>
              <svg className='w-10 h-10 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} 
                      d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
              </svg>
            </div>

            {/* Header */}
            <div className='flex flex-col items-center gap-2 text-center'>
              <h1 className='text-3xl font-bold text-gray-900'>Rental Contract</h1>
              <h2 className='text-xl text-gray-700'>Gestió de Contractes de Lloguer</h2>
              <p className='text-sm text-gray-500 mt-2 max-w-sm'>
                Plataforma descentralitzada per crear i gestionar contractes de lloguer a la blockchain MultiversX
              </p>
            </div>

            {/* Features */}
            <div className='w-full space-y-3 text-sm text-gray-600'>
              <div className='flex items-start gap-3'>
                <svg className='w-5 h-5 text-green-600 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                <span>Crea i gestiona contractes de lloguer sense intermediaris</span>
              </div>
              <div className='flex items-start gap-3'>
                <svg className='w-5 h-5 text-green-600 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                <span>Pagaments segurs i transparents amb fiança protegida</span>
              </div>
            </div>

            {/* Divider */}
            <div className='w-full border-t border-gray-200'></div>

            {/* Login Section */}
            <div className='flex flex-col items-center gap-3 w-full'>
              <p className='text-gray-700 font-medium'>Connecta el teu wallet per començar</p>
              <WebWalletLoginButton
                loginButtonText='MultiversX Web Wallet'
                {...commonProps}
              />
            </div>

            {/* Footer */}
            <p className='text-xs text-gray-400 text-center'>
              Xarxa: <span className='font-semibold text-blue-600'>Devnet</span>
            </p>
          </div>
        </div>
      </div>
    </AuthRedirectWrapper>
  );
};
