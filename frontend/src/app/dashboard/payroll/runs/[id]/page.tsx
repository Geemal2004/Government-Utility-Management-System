'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Play,
    Check,
    X,
    Download,
    FileText,
    RefreshCw,
    AlertCircle,
    DollarSign,
    Users,
    TrendingDown,
    Wallet,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
} from 'lucide-react';
import {
    PayrollRunDto,
    PayrollRunStatus,
    formatCurrency,
    getMonthName,
} from '@/types/payroll';
import { PayrollStatusBadge, StatCard } from '@/components/payroll/PayrollComponents';
import { Tabs } from '@/components/employees/ProfileComponents';
import { PayslipsTable, PayslipDto } from '@/components/payroll/PayslipsTable';
import {
    ProcessPayrollModal,
    ApprovePayrollModal,
    CancelPayrollModal,
} from '@/components/payroll/PayrollModals';

type RunTab = 'payslips' | 'summary' | 'log';

const RUN_TABS = [
    { id: 'payslips', label: 'Payslips' },
    { id: 'summary', label: 'Summary Report' },
    { id: 'log', label: 'Processing Log' },
];

interface RunDetail extends PayrollRunDto {
    payslips?: PayslipDto[];
    summary?: {
        byDepartment: Array<{
            departmentId: number;
            departmentName: string;
            employees: number;
            totalGross: number;
            totalNet: number;
            avgSalary: number;
        }>;
    };
    logs?: Array<{
        timestamp: string;
        action: string;
        details?: string;
        actorName?: string;
    }>;
}

// Get auth token
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Get current user role
function useCurrentUserRole(): string {
    return 'ADMIN'; // Should come from auth context
}

export default function PayrollRunDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const runId = parseInt(params.id as string);
    const currentUserRole = useCurrentUserRole();

    // State
    const [run, setRun] = useState<RunDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<RunTab>('payslips');

    // Modal states
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Permissions
    const isAdmin = currentUserRole === 'ADMIN';
    const isManager = currentUserRole === 'MANAGER';
    const canProcess = (isAdmin || isManager) && run?.status === PayrollRunStatus.DRAFT;
    const canApprove = isAdmin && run?.status === PayrollRunStatus.PROCESSING;
    const canCancel = isAdmin && run?.status === PayrollRunStatus.PROCESSING;
    const canExport = run?.status === PayrollRunStatus.COMPLETED;

    // Fetch run details
    const fetchRunDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            const response = await fetch(`/api/v1/payroll/runs/${runId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Payroll run not found');
                }
                throw new Error('Failed to fetch payroll run');
            }

            const result = await response.json();
            setRun(result.data || result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [runId]);

    useEffect(() => {
        fetchRunDetails();
    }, [fetchRunDetails]);

    // Handle download
    const handleDownloadPayslip = async (payslipId: number) => {
        const token = getAuthToken();
        window.open(`/api/v1/payroll/payslips/${payslipId}/download?token=${token}`, '_blank');
    };

    // Handle export
    const handleExportCsv = () => {
        const token = getAuthToken();
        window.open(`/api/v1/payroll/runs/${runId}/export?token=${token}`, '_blank');
    };

    // Get period title
    const periodTitle = useMemo(() => {
        if (!run) return '';
        return `${getMonthName(run.month)} ${run.year} Payroll`;
    }, [run]);

    // Loading state
    if (isLoading) {
        return <PageSkeleton />;
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.push('/dashboard/payroll')}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Back to Payroll
                        </button>
                        <button
                            onClick={fetchRunDetails}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!run) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* Back button */}
                    <button
                        onClick={() => router.push('/dashboard/payroll')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Payroll
                    </button>

                    {/* Title and actions */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">{periodTitle}</h1>
                                <PayrollStatusBadge status={run.status} />
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Created: {new Date(run.createdAt).toLocaleDateString()}
                                </span>
                                {run.createdByName && (
                                    <span>by {run.createdByName}</span>
                                )}
                                {run.approvedByName && run.approvedAt && (
                                    <span className="flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Approved by {run.approvedByName}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            {canProcess && (
                                <button
                                    onClick={() => setShowProcessModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                                >
                                    <Play className="w-4 h-4" />
                                    Process Payroll
                                </button>
                            )}
                            {canApprove && (
                                <button
                                    onClick={() => setShowApproveModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                                >
                                    <Check className="w-4 h-4" />
                                    Approve
                                </button>
                            )}
                            {canCancel && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 font-medium rounded-lg hover:bg-red-100"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            )}
                            {canExport && (
                                <>
                                    <button
                                        onClick={handleExportCsv}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export CSV
                                    </button>
                                    <button
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Download Report
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Employees"
                        value={run.totalEmployees}
                        icon={<Users className="w-6 h-6 text-blue-600" />}
                        iconBg="bg-blue-100"
                    />
                    <StatCard
                        title="Total Gross"
                        value={formatCurrency(run.totalGross)}
                        icon={<DollarSign className="w-6 h-6 text-green-600" />}
                        iconBg="bg-green-100"
                    />
                    <StatCard
                        title="Total Deductions"
                        value={formatCurrency(run.totalDeductions)}
                        icon={<TrendingDown className="w-6 h-6 text-red-600" />}
                        iconBg="bg-red-100"
                    />
                    <StatCard
                        title="Total Net"
                        value={formatCurrency(run.totalNet)}
                        icon={<Wallet className="w-6 h-6 text-purple-600" />}
                        iconBg="bg-purple-100"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-t-xl border-t border-x border-gray-200">
                    <Tabs
                        tabs={RUN_TABS}
                        activeTab={activeTab}
                        onChange={(tab) => setActiveTab(tab as RunTab)}
                    />
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 pb-8">
                <div className="bg-white rounded-b-xl border-x border-b border-gray-200 p-6">
                    {activeTab === 'payslips' && (
                        <PayslipsTab
                            payslips={run.payslips || []}
                            isDraft={run.status === PayrollRunStatus.DRAFT}
                            onDownload={handleDownloadPayslip}
                        />
                    )}
                    {activeTab === 'summary' && (
                        <SummaryTab summary={run.summary} run={run} />
                    )}
                    {activeTab === 'log' && (
                        <ProcessingLogTab logs={run.logs || []} run={run} />
                    )}
                </div>
            </div>

            {/* Modals */}
            <ProcessPayrollModal
                isOpen={showProcessModal}
                onClose={() => setShowProcessModal(false)}
                runId={runId}
                employeeCount={run.totalEmployees}
                periodTitle={periodTitle}
                onComplete={fetchRunDetails}
            />

            <ApprovePayrollModal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                runId={runId}
                periodTitle={periodTitle}
                totalNet={run.totalNet}
                employeeCount={run.totalEmployees}
                onComplete={fetchRunDetails}
            />

            <CancelPayrollModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                runId={runId}
                periodTitle={periodTitle}
                onComplete={fetchRunDetails}
            />
        </div>
    );
}

// Payslips Tab
function PayslipsTab({
    payslips,
    isDraft,
    onDownload,
}: {
    payslips: PayslipDto[];
    isDraft: boolean;
    onDownload: (id: number) => void;
}) {
    return (
        <PayslipsTable
            payslips={payslips}
            isLoading={false}
            isDraft={isDraft}
            onDownload={onDownload}
        />
    );
}

// Summary Tab
function SummaryTab({
    summary,
    run,
}: {
    summary?: RunDetail['summary'];
    run: RunDetail;
}) {
    const departments = summary?.byDepartment || [];

    return (
        <div className="space-y-6">
            {/* By Department Table */}
            <div>
                <h3 className="font-semibold text-gray-900 mb-4">By Department</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Department</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Employees</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Gross</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Net</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Avg Salary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {departments.length > 0 ? (
                                departments.map((dept, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {dept.departmentName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                                            {dept.employees}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                            {formatCurrency(dept.totalGross)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                            {formatCurrency(dept.totalNet)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                                            {formatCurrency(dept.avgSalary)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No department data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {departments.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 font-semibold">
                                    <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900">{run.totalEmployees}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(run.totalGross)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(run.totalNet)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                                        {formatCurrency(run.totalNet / run.totalEmployees)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <div className="w-48 h-48 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <span className="text-gray-400">Pie Chart</span>
                    </div>
                    <p className="text-sm text-gray-500">Salary Distribution by Department</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-gray-400">Bar Chart</span>
                    </div>
                    <p className="text-sm text-gray-500">Top 10 Highest Paid</p>
                </div>
            </div>
        </div>
    );
}

// Processing Log Tab
function ProcessingLogTab({
    logs,
    run,
}: {
    logs: Array<{ timestamp: string; action: string; details?: string; actorName?: string }>;
    run: RunDetail;
}) {
    // Generate default logs from run data if none exist
    const displayLogs = logs.length > 0 ? logs : [
        {
            timestamp: run.createdAt,
            action: 'Payroll run created',
            actorName: run.createdByName || 'Admin User',
        },
        ...(run.status !== PayrollRunStatus.DRAFT ? [{
            timestamp: run.createdAt,
            action: 'Payroll processing started',
            details: `${run.totalEmployees} payslips to generate`,
        }] : []),
        ...(run.status === PayrollRunStatus.COMPLETED || run.status === PayrollRunStatus.PROCESSING ? [{
            timestamp: run.createdAt,
            action: 'Processing completed',
            details: `Success: ${run.totalEmployees}`,
        }] : []),
        ...(run.approvedAt ? [{
            timestamp: run.approvedAt,
            action: 'Payroll approved',
            actorName: run.approvedByName || 'Admin',
        }] : []),
        ...(run.status === PayrollRunStatus.CANCELLED ? [{
            timestamp: run.cancelledAt || run.createdAt,
            action: 'Payroll cancelled',
            details: run.cancellationReason,
        }] : []),
    ];

    return (
        <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Timeline items */}
            <div className="space-y-6">
                {displayLogs.map((log, i) => (
                    <div key={i} className="relative flex gap-4 pl-10">
                        {/* Timeline dot */}
                        <div className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white shadow ${log.action.includes('cancelled') ? 'bg-red-500' :
                                log.action.includes('approved') ? 'bg-green-500' :
                                    log.action.includes('completed') ? 'bg-blue-500' :
                                        'bg-gray-400'
                            }`}>
                            {log.action.includes('approved') && <CheckCircle className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                            {log.action.includes('cancelled') && <XCircle className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{log.action}</span>
                                <span className="text-sm text-gray-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                            </div>
                            {log.details && (
                                <p className="text-sm text-gray-600">{log.details}</p>
                            )}
                            {log.actorName && (
                                <p className="text-sm text-gray-500">by {log.actorName}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Page skeleton
function PageSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="w-32 h-7 bg-gray-200 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
