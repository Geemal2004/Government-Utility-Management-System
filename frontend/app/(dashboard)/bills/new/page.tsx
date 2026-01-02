'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CalculatorIcon,
  DocumentPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { BillStatus } from '@/types/bill';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface MeterOption {
  meterId: number;
  meterSerialNo: string;
  customerName: string;
  customerId: number;
  lastReadingDate: string;
  lastBillDate?: string;
  utilityType: string;
  hasSolar: boolean;
  subsidyEligible: boolean;
}

interface BillCalculation {
  consumption: {
    previousReading: number;
    currentReading: number;
    consumedUnits: number;
    exportUnits?: number;
  };
  billDetails: Array<{
    slabRange: string;
    units: number;
    ratePerUnit: number;
    amount: number;
  }>;
  fixedCharge: number;
  subsidy?: number;
  solarCredit?: number;
  taxes: Array<{
    taxName: string;
    ratePercent: number;
    taxAmount: number;
  }>;
  totalAmount: number;
}

interface BillFormData {
  meterId: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  applySubsidy: boolean;
  applySolarCredit: boolean;
}

export default function NewBillPage() {
  const router = useRouter();
  const [meters, setMeters] = useState<MeterOption[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<MeterOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMeterDropdown, setShowMeterDropdown] = useState(false);
  const [calculation, setCalculation] = useState<BillCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BillFormData>({
    defaultValues: {
      applySubsidy: true,
      applySolarCredit: true,
    },
  });

  const watchedFields = watch();

  // Fetch available meters
  useEffect(() => {
    fetchMeters();
  }, []);

  // Auto-set due date 30 days after start date
  useEffect(() => {
    if (watchedFields.billingPeriodStart) {
      const startDate = new Date(watchedFields.billingPeriodStart);
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + 30);
      setValue('dueDate', dueDate.toISOString().split('T')[0]);
    }
  }, [watchedFields.billingPeriodStart, setValue]);

  const fetchMeters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/meters?status=ACTIVE`);
      if (!response.ok) throw new Error('Failed to fetch meters');
      const result = await response.json();
      
      // Transform meter data to include customer info
      const meterOptions: MeterOption[] = result.data.map((meter: any) => ({
        meterId: meter.meterId,
        meterSerialNo: meter.meterSerialNo,
        customerName: `${meter.customer?.firstName} ${meter.customer?.lastName}`,
        customerId: meter.customer?.customerId,
        lastReadingDate: meter.lastReading?.readingDate || 'No readings',
        lastBillDate: meter.lastBill?.billDate,
        utilityType: meter.utilityType?.name,
        hasSolar: meter.hasSolar || false,
        subsidyEligible: meter.customer?.subsidyEligible || false,
      }));
      
      setMeters(meterOptions);
    } catch (err) {
      console.error('Error fetching meters:', err);
    }
  };

  const filteredMeters = meters.filter(
    (meter) =>
      meter.meterSerialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meter.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMeterSelect = (meter: MeterOption) => {
    setSelectedMeter(meter);
    setValue('meterId', meter.meterId);
    setValue('applySubsidy', meter.subsidyEligible);
    setValue('applySolarCredit', meter.hasSolar);
    setShowMeterDropdown(false);
    setSearchTerm('');
    setCalculation(null);
    setError(null);
  };

  const handleCalculatePreview = async () => {
    setError(null);
    
    // Validation
    if (!watchedFields.meterId) {
      setError('Please select a meter');
      return;
    }
    if (!watchedFields.billingPeriodStart || !watchedFields.billingPeriodEnd) {
      setError('Please select billing period dates');
      return;
    }
    if (new Date(watchedFields.billingPeriodEnd) <= new Date(watchedFields.billingPeriodStart)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setCalculating(true);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/bills/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterId: watchedFields.meterId,
          billingPeriodStart: watchedFields.billingPeriodStart,
          billingPeriodEnd: watchedFields.billingPeriodEnd,
          applySubsidy: watchedFields.applySubsidy,
          applySolarCredit: watchedFields.applySolarCredit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to calculate bill');
      }

      const result = await response.json();
      setCalculation(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate bill');
      console.error('Error calculating bill:', err);
    } finally {
      setCalculating(false);
    }
  };

  const onSubmit = async (data: BillFormData) => {
    if (!calculation) {
      setError('Please calculate preview first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/v1/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate bill');
      }

      const result = await response.json();
      
      // Show success message
      alert(`Bill #${result.data.billId} generated successfully!`);
      
      // Redirect to bill detail page
      router.push(`/bills/${result.data.billId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate bill');
      console.error('Error generating bill:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Bills
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Generate New Bill</h1>
          <p className="text-gray-600 mt-1">Create a new utility bill for a customer</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Meter Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Select Meter</h2>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meter <span className="text-red-500">*</span>
              </label>
              
              {selectedMeter ? (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Meter Serial:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedMeter.meterSerialNo}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Customer:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedMeter.customerName}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Utility Type:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedMeter.utilityType}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Last Reading Date:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedMeter.lastReadingDate !== 'No readings' 
                            ? formatDate(selectedMeter.lastReadingDate)
                            : 'No readings'}
                        </span>
                      </div>
                      {selectedMeter.lastBillDate && (
                        <div>
                          <span className="text-sm text-gray-600">Last Bill Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatDate(selectedMeter.lastBillDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMeter(null);
                        setValue('meterId', 0);
                        setCalculation(null);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by meter serial or customer name"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowMeterDropdown(true);
                      }}
                      onFocus={() => setShowMeterDropdown(true)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {showMeterDropdown && filteredMeters.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredMeters.map((meter) => (
                        <button
                          key={meter.meterId}
                          type="button"
                          onClick={() => handleMeterSelect(meter)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{meter.meterSerialNo}</div>
                          <div className="text-sm text-gray-600">{meter.customerName}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {meter.utilityType} • Last reading: {
                              meter.lastReadingDate !== 'No readings'
                                ? formatDate(meter.lastReadingDate)
                                : 'No readings'
                            }
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {errors.meterId && (
                <p className="mt-1 text-sm text-red-600">Meter is required</p>
              )}
            </div>
          </div>

          {/* Billing Period */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Billing Period</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('billingPeriodStart', { required: 'Start date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.billingPeriodStart && (
                  <p className="mt-1 text-sm text-red-600">{errors.billingPeriodStart.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('billingPeriodEnd', { required: 'End date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.billingPeriodEnd && (
                  <p className="mt-1 text-sm text-red-600">{errors.billingPeriodEnd.message}</p>
                )}
              </div>
            </div>

            {watchedFields.billingPeriodStart && watchedFields.billingPeriodEnd && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <ClockIcon className="w-4 h-4 inline mr-2" />
                  Billing period: {formatDate(watchedFields.billingPeriodStart)} to {formatDate(watchedFields.billingPeriodEnd)}
                </p>
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Due Date</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('dueDate', { required: 'Due date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">Default: 30 days from billing start date</p>
            </div>
          </div>

          {/* Options */}
          {selectedMeter && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Options</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('applySubsidy')}
                    disabled={!selectedMeter.subsidyEligible}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-900">
                      Apply Subsidy
                    </label>
                    <p className="text-sm text-gray-600">
                      {selectedMeter.subsidyEligible ? (
                        <span className="text-green-600">
                          <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                          Customer is eligible for subsidy
                        </span>
                      ) : (
                        <span className="text-gray-500">
                          <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                          Customer is not eligible for subsidy
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    {...register('applySolarCredit')}
                    disabled={!selectedMeter.hasSolar}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-900">
                      Apply Solar Export Credit
                    </label>
                    <p className="text-sm text-gray-600">
                      {selectedMeter.hasSolar ? (
                        <span className="text-green-600">
                          <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                          Meter has solar export capability
                        </span>
                      ) : (
                        <span className="text-gray-500">
                          <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                          Meter does not have solar export
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-900">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {calculation && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Bill Preview</h2>

              {/* Consumption */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Consumption Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Previous Reading</p>
                    <p className="text-xl font-bold text-gray-900">{calculation.consumption.previousReading.toFixed(3)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Current Reading</p>
                    <p className="text-xl font-bold text-gray-900">{calculation.consumption.currentReading.toFixed(3)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Consumption</p>
                    <p className="text-2xl font-bold text-blue-600">{calculation.consumption.consumedUnits.toFixed(3)} units</p>
                  </div>
                </div>
                {calculation.consumption.exportUnits && calculation.consumption.exportUnits > 0 && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      Solar Export: {calculation.consumption.exportUnits.toFixed(3)} units
                    </p>
                  </div>
                )}
              </div>

              {/* Energy Charges */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Energy Charges Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slab Range</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate per Unit</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {calculation.billDetails.map((detail, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{detail.slabRange}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{detail.units.toFixed(3)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(detail.ratePerUnit)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(detail.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Energy Charges Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(calculation.billDetails.reduce((sum, d) => sum + d.amount, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Fixed Charge</span>
                  <span className="font-medium text-gray-900">{formatCurrency(calculation.fixedCharge)}</span>
                </div>
                
                {calculation.subsidy && calculation.subsidy > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subsidy</span>
                    <span className="font-medium text-green-600">-{formatCurrency(calculation.subsidy)}</span>
                  </div>
                )}
                
                {calculation.solarCredit && calculation.solarCredit > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Solar Export Credit</span>
                    <span className="font-medium text-green-600">-{formatCurrency(calculation.solarCredit)}</span>
                  </div>
                )}

                {calculation.taxes.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="font-medium text-gray-900 mb-2">Taxes</div>
                    {calculation.taxes.map((tax, index) => (
                      <div key={index} className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{tax.taxName} ({tax.ratePercent}%)</span>
                        <span className="text-gray-900">{formatCurrency(tax.taxAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t-2">
                  <span className="text-xl font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(calculation.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCalculatePreview}
                disabled={calculating || !selectedMeter}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {calculating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <CalculatorIcon className="w-5 h-5" />
                    Calculate Preview
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={loading || !calculation}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <DocumentPlusIcon className="w-5 h-5" />
                    Generate Bill
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>

            {!calculation && selectedMeter && (
              <p className="mt-3 text-sm text-gray-600">
                <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                Click "Calculate Preview" to see the bill breakdown before generating
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
