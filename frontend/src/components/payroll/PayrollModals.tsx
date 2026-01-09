'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check, AlertTriangle, RefreshCw, Users } from 'lucide-react';
import { Modal } from '@/components/employees/ProfileComponents';
import { formatCurrency } from '@/types/payroll';

interface ProcessPayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    runId: number;
    employeeCount: number;
    periodTitle: string;
    onComplete: () => void;
}

export function ProcessPayrollModal({
    isOpen,
    onClose,
    runId,
    employeeCount,
    periodTitle,
    onComplete,
}: ProcessPayrollModalProps) {
    const [step, setStep] = useState<'confirm' | 'processing' | 'complete'>('confirm');
    const [isDryRun, setIsDryRun] = useState(false);
    const [processAll, setProcessAll] = useState(true);
    const [progress, setProgress] = useState({ current: 0, total: employeeCount, currentEmployee: '' });
    const [results, setResults] = useState<{
        success: number;
        failed: number;
        failedList: Array<{ employeeId: number; name: string; reason: string }>;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

    const startProcessing = async () => {
        setStep('processing');
        setError(null);
        setProgress({ current: 0, total: employeeCount, currentEmployee: 'Starting...' });

        try {
            const token = getToken();
            const response = await fetch(`/api/v1/payroll/runs/${runId}/process`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dryRun: isDryRun,
                    processAll,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to process payroll');
            }

            const result = await response.json();
            const data = result.data || result;

            setResults({
                success: data.totalProcessed || data.success?.length || 0,
                failed: data.totalFailed || data.failed?.length || 0,
                failedList: data.failed || [],
            });
            setProgress({ current: employeeCount, total: employeeCount, currentEmployee: '' });
            setStep('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Processing failed');
            setStep('confirm');
        }
    };

    const handleClose = () => {
        if (step === 'processing') return; // Don't allow close during processing
        setStep('confirm');
        setResults(null);
        setError(null);
        onClose();
        if (step === 'complete') {
            onComplete();
        }
    };

    const handleRetryFailed = () => {
        // Reset and retry with failed employees
        setStep('confirm');
        setProcessAll(false);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Process Payroll Run" size="md">
            <div className="p-6">
                {step === 'confirm' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-gray-600">This will generate payslips for:</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">{employeeCount} employees</p>
                            <p className="text-gray-500 mt-1">Period: {periodTitle}</p>
                        </div>

                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isDryRun}
                                    onChange={(e) => setIsDryRun(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-700">Dry Run (preview only)</span>
                                    <p className="text-sm text-gray-500">No payslips will be saved</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={processAll}
                                    onChange={() => setProcessAll(true)}
                                    className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="font-medium text-gray-700">Process All Employees</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!processAll}
                                    onChange={() => setProcessAll(false)}
                                    className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="font-medium text-gray-700">Select Specific Employees</span>
                            </label>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={startProcessing}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                            >
                                {isDryRun ? 'Preview' : 'Process'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="space-y-6 text-center py-4">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Processing Payroll...</h3>
                            <p className="text-sm text-gray-500 mt-1">{progress.currentEmployee}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-600">
                                {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                            </p>
                        </div>

                        <p className="text-xs text-gray-400">Please don't close this window</p>
                    </div>
                )}

                {step === 'complete' && results && (
                    <div className="space-y-6">
                        <div className="text-center">
                            {results.failed === 0 ? (
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                                </div>
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">
                                {isDryRun ? 'Preview Complete' : 'Payroll Processing Complete'}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-green-600">{results.success}</p>
                                <p className="text-sm text-green-700">Successfully processed</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                                <p className="text-sm text-red-700">Failed</p>
                            </div>
                        </div>

                        {results.failedList.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="font-medium text-red-800 mb-2">Failed Employees:</h4>
                                <ul className="space-y-1 text-sm text-red-700 max-h-32 overflow-y-auto">
                                    {results.failedList.map((item, i) => (
                                        <li key={i}>• {item.name || `Employee #${item.employeeId}`} - {item.reason}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-3">
                            {results.failed > 0 && (
                                <button
                                    onClick={handleRetryFailed}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Failed
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

interface ApprovePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    runId: number;
    periodTitle: string;
    totalNet: number;
    employeeCount: number;
    onComplete: () => void;
}

export function ApprovePayrollModal({
    isOpen,
    onClose,
    runId,
    periodTitle,
    totalNet,
    employeeCount,
    onComplete,
}: ApprovePayrollModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

    const handleApprove = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getToken();
            const response = await fetch(`/api/v1/payroll/runs/${runId}/approve`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to approve payroll');
            }

            onClose();
            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Approval failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Approve Payroll Run" size="sm">
            <div className="p-6 space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-600">You are about to approve:</p>
                    <p className="text-xl font-bold text-gray-900 mt-2">{periodTitle}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Net Pay:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(totalNet)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Employees:</span>
                        <span className="font-semibold text-gray-900">{employeeCount}</span>
                    </div>
                </div>

                <p className="text-sm text-gray-500 text-center">
                    Once approved, payslips will be finalized and sent to employees.
                </p>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Approve
                    </button>
                </div>
            </div>
        </Modal>
    );
}

interface CancelPayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    runId: number;
    periodTitle: string;
    onComplete: () => void;
}

export function CancelPayrollModal({
    isOpen,
    onClose,
    runId,
    periodTitle,
    onComplete,
}: CancelPayrollModalProps) {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

    const handleCancel = async () => {
        if (!reason.trim()) {
            setError('Please provide a reason for cancellation');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = getToken();
            const response = await fetch(`/api/v1/payroll/runs/${runId}/cancel`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: reason.trim() }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to cancel payroll');
            }

            onClose();
            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Cancellation failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cancel Payroll Run" size="sm">
            <div className="p-6 space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-gray-600">Cancel payroll run for:</p>
                    <p className="text-xl font-bold text-gray-900 mt-2">{periodTitle}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for cancellation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please provide a reason..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    <strong>Warning:</strong> This action cannot be undone.
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isLoading || !reason.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirm Cancellation
                    </button>
                </div>
            </div>
        </Modal>
    );
}
