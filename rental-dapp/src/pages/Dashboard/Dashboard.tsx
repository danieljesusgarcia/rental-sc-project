import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthRedirectWrapper } from 'wrappers';
import { RouteNamesEnum } from 'localConstants';



export const Dashboard = () => {
  const navigate = useNavigate();

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
      </div>
    </AuthRedirectWrapper>
  );
};
