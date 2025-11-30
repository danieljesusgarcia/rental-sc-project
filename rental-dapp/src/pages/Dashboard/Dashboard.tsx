import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthRedirectWrapper } from 'wrappers';
import { RouteNamesEnum } from 'localConstants';
import { rentalContractAddress, EXPLORER_URL, API_URL } from 'config';
import axios from 'axios';

interface Transaction {
  txHash: string;
  sender: string;
  receiver: string;
  function: string;
  timestamp: number;
  status: string;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const explorerUrl = `${EXPLORER_URL}/accounts/${rentalContractAddress}`;
  const transactionsUrl = `${EXPLORER_URL}/accounts/${rentalContractAddress}#Transactions`;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Obtenir transaccions i transfers en paral·lel
        const [txResponse, transfersResponse] = await Promise.all([
          axios.get(`${API_URL}/accounts/${rentalContractAddress}/transactions?size=10`),
          axios.get(`${API_URL}/accounts/${rentalContractAddress}/transfers?size=10`)
        ]);
        
        const txData = Array.isArray(txResponse.data) ? txResponse.data : (txResponse.data?.data || []);
        const transferData = Array.isArray(transfersResponse.data) ? transfersResponse.data : (transfersResponse.data?.data || []);
        
        // Deduplicar per txHash i combinar
        const txMap = new Map();
        [...txData, ...transferData].forEach(tx => {
          if (!txMap.has(tx.txHash)) {
            txMap.set(tx.txHash, tx);
          }
        });
        
        // Ordenar per timestamp i agafar les 5 més recents
        const allTransactions = Array.from(txMap.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);
        
        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <AuthRedirectWrapper>
      <div className='flex flex-col gap-8 max-w-7xl mx-auto px-6 py-8'>
        <div className='flex flex-col gap-3 text-center'>
          <h1 className='text-4xl font-semibold text-primary'>Gestió de Contractes de Lloguer</h1>
          <p className='text-lg text-secondary max-w-2xl mx-auto'>
            Gestiona els teus contractes de lloguer a la blockchain MultiversX
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-6 grid-cards'>
          <div className='card p-8 hover-lift cursor-pointer'
               onClick={() => navigate(RouteNamesEnum.create)}>
            <div className='flex items-start gap-4'>
              <div className='p-3 rounded-lg' style={{backgroundColor: 'rgba(139, 115, 85, 0.1)'}}>
                <svg className='w-8 h-8 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                </svg>
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold mb-2'>Crear Contracte</h3>
                <p className='text-muted'>
                  Crea un nou contracte de lloguer com a propietari
                </p>
              </div>
            </div>
          </div>

          <div className='card p-8 hover-lift cursor-pointer'
               onClick={() => navigate(RouteNamesEnum.landlord)}>
            <div className='flex items-start gap-4'>
              <div className='p-3 rounded-lg' style={{backgroundColor: 'rgba(124, 152, 133, 0.15)'}}>
                <svg className='w-8 h-8' style={{color: '#7C9885'}} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} 
                        d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
                </svg>
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold mb-2'>Les Meves Propietats</h3>
                <p className='text-muted'>
                  Visualitza els contractes on ets el propietari
                </p>
              </div>
            </div>
          </div>

          <div className='card p-8 hover-lift cursor-pointer'
               onClick={() => navigate(RouteNamesEnum.tenant)}>
            <div className='flex items-start gap-4'>
              <div className='p-3 rounded-lg' style={{backgroundColor: 'rgba(212, 163, 115, 0.15)'}}>
                <svg className='w-8 h-8' style={{color: '#D4A373'}} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} 
                        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                </svg>
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold mb-2'>Els Meus Lloguers</h3>
                <p className='text-muted'>
                  Visualitza els contractes on ets el llogater
                </p>
              </div>
            </div>
          </div>

          <div className='card p-8 hover-lift cursor-pointer'
               onClick={() => navigate(RouteNamesEnum.contracts)}>
            <div className='flex items-start gap-4'>
              <div className='p-3 rounded-lg' style={{backgroundColor: 'rgba(125, 155, 166, 0.15)'}}>
                <svg className='w-8 h-8' style={{color: '#7D9BA6'}} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} 
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold mb-2'>Tots els Contractes</h3>
                <p className='text-muted'>
                  Visualitza tots els teus contractes de lloguer
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-6'>
          <div className='card p-10 accent-border-left'>
            <h3 className='text-2xl font-semibold mb-6 text-primary'>Com funciona</h3>
            <ol className='list-decimal list-inside space-y-3 text-secondary'>
              <li className='pl-2'>El propietari crea un contracte de lloguer amb les condicions</li>
              <li className='pl-2'>El llogater accepta el contracte i paga la fiança</li>
              <li className='pl-2'>El llogater fa els pagaments mensuals del lloguer</li>
              <li className='pl-2'>Al final del contracte, ambdues parts decideixen sobre el retorn de la fiança</li>
              <li className='pl-2'>Si estan d'acord, la fiança es retorna automàticament</li>
            </ol>
          </div>

          <div className='card p-10'>
            <h3 className='text-2xl font-semibold mb-6 text-primary'>Smart Contract</h3>
            <div className='space-y-4'>
              <div>
                <p className='text-sm text-muted mb-1'>Adreça del Contracte</p>
                <div className='flex items-center gap-2'>
                  <code className='text-xs bg-black bg-opacity-5 px-3 py-2 rounded font-mono break-all flex-1'>
                    {rentalContractAddress}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(rentalContractAddress)}
                    className='p-2 hover:bg-black hover:bg-opacity-5 rounded transition-colors'
                    title='Copiar adreça'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                    </svg>
                  </button>
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                <a
                  href={explorerUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn-primary-outline flex items-center justify-center gap-2 py-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                  Veure al Explorer
                </a>

                <a
                  href={transactionsUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn-secondary-outline flex items-center justify-center gap-2 py-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  Veure Transaccions
                </a>
              </div>

              <div className='pt-4 border-t border-black border-opacity-10'>
                <p className='text-xs text-muted'>
                  <strong>Xarxa:</strong> MultiversX Devnet<br/>
                  <strong>Mida:</strong> 7454 bytes<br/>
                  <strong>Framework:</strong> Rust sc-framework 0.59.1
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='card p-10'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-2xl font-semibold text-primary'>Últimes Transaccions</h3>
            <a
              href={transactionsUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm text-primary hover:underline'
            >
              Veure totes →
            </a>
          </div>

          {loading ? (
            <div className='flex justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
          ) : transactions.length === 0 ? (
            <p className='text-center text-muted py-8'>No hi ha transaccions encara</p>
          ) : (
            <div className='space-y-3'>
              {transactions.map((tx) => {
                const isSuccess = tx.status === 'success';
                const statusColor = isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                const statusText = isSuccess ? 'Success' : 'Failed';
                
                return (
                  <div
                    key={tx.txHash}
                    className='flex items-center justify-between p-4 bg-black bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-colors'
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='font-mono text-sm font-semibold'>
                          {tx.function || 'Transfer'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <a
                        href={`${EXPLORER_URL}/transactions/${tx.txHash}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs font-mono text-muted hover:text-primary transition-colors'
                      >
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-8)}
                      </a>
                    </div>
                    <div className='text-right text-xs text-muted'>
                      {new Date(tx.timestamp * 1000).toLocaleString('ca-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthRedirectWrapper>
  );
};
