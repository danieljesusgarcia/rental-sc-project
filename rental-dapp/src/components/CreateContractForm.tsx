import React, { useState } from 'react';
import { useRentalContract } from 'hooks/useRentalContract';
import { parseAmount } from '@multiversx/sdk-dapp/utils/operations';

export const CreateContractForm: React.FC = () => {
  const { createRentalContract } = useRentalContract();
  const [formData, setFormData] = useState({
    tenant: '',
    depositAmount: '',
    monthlyRent: '',
    durationMonths: '',
    contractReference: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const depositInWei = parseAmount(formData.depositAmount);
      const rentInWei = parseAmount(formData.monthlyRent);

      await createRentalContract({
        tenant: formData.tenant,
        depositAmount: depositInWei,
        monthlyRent: rentInWei,
        durationMonths: parseInt(formData.durationMonths),
        contractReference: formData.contractReference
      });

      // Reset form
      setFormData({
        tenant: '',
        depositAmount: '',
        monthlyRent: '',
        durationMonths: '',
        contractReference: ''
      });
    } catch (error) {
      console.error('Error creating contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className='card p-8'>
      <h2 className='text-3xl font-semibold mb-8 text-primary accent-border-left pl-4'>Crear Nou Contracte de Lloguer</h2>
      
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <label className='block text-sm font-medium mb-2 text-secondary'>
            Adreça del Llogater
          </label>
          <input
            type='text'
            name='tenant'
            value={formData.tenant}
            onChange={handleChange}
            placeholder='erd1...'
            required
            className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div className='grid grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium mb-2 text-secondary'>
              Import de la Fiança (EGLD)
            </label>
            <input
              type='number'
              step='0.001'
              name='depositAmount'
              value={formData.depositAmount}
              onChange={handleChange}
              placeholder='1.0'
              required
              className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2 text-secondary'>
              Lloguer Mensual (EGLD)
            </label>
            <input
              type='number'
              step='0.001'
              name='monthlyRent'
              value={formData.monthlyRent}
              onChange={handleChange}
              placeholder='0.5'
              required
              className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium mb-2 text-secondary'>
            Durada (mesos)
          </label>
          <input
            type='number'
            name='durationMonths'
            value={formData.durationMonths}
            onChange={handleChange}
            placeholder='12'
            required
            min='1'
            className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-2 text-secondary'>
            Referència del Contracte
          </label>
          <textarea
            name='contractReference'
            value={formData.contractReference}
            onChange={handleChange}
            placeholder='Detalls de la propietat, condicions, etc.'
            required
            rows={3}
            className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full btn btn-primary py-3 text-lg font-medium mt-8'
        >
          {loading ? 'Creant Contracte...' : 'Crear Contracte'}
        </button>
      </form>
    </div>
  );
};
