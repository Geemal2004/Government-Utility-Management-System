'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus,
    Settings,
    DollarSign,
    Users,
    TrendingUp,
    Clock,
    RefreshCw,
    AlertCircle,
    Calendar,
    Filter,
    X,
} from 'lucide-react';
import {
    PayrollRunDto,
    PayrollRunStatus,
    PayrollRunFilters,
    Paginated,
    getCurrentPeriod,
    getMonthName,
    formatCurrency,
    MONTH_NAMES,
} from '@/types/payroll';
import { StatCard, CurrentMonthCard } from '@/components/payroll/PayrollComponents';
import { PayrollTable, PayrollPagination } from '@/components/payroll/PayrollTable';

// Get auth token
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Get current user role
function useCurrentUserRole(): string {
    // This should come from auth context
    return 'ADMIN';
}

export default function PayrollPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUserRole = useCurrentUserRole();
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Current period
    const currentPeriod = useMemo(() => getCurrentPeriod(), []);

    // State
    const [runs, setRuns] = useState<PayrollRunDto[]>([]);
    const [total, setTotal] = useState(0);
    const [currentMonthRun, setCurrentMonthRun] = useState<PayrollRunDto | null>(null);
    const [stats, setStats] = useState<{
        thisMonthNet: number;
        lastMonthNet: number;
        averageSalary: number;
        pendingApprovals: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Filters from URL
    const filters: PayrollRunFilters = useMemo(() => {
        const statusParam = searchParams.get('status');
        return {
            status: statusParam ? (statusParam as PayrollRunStatus) : undefined,
            month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
            year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
            page: parseInt(searchParams.get('page') || '1'),
            limit: parseInt(searchParams.get('limit') || '10'),
        };
    }, [searchParams]);

    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'runDate');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(
        (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'
    );

    // Update URL with filters
    const updateFilters = useCallback(
        (newFilters: Partial<PayrollRunFilters>) => {
            const params = new URLSearchParams(searchParams.toString());

            Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') {
                    params.delete(key);
                } else {
                    params.set(key, String(value));
                }
            });

            router.push(`/dashboard/payroll?${params.toString()}`, { scroll: false });
        },
        [filters, router, searchParams]
    );

    // Fetch payroll runs
    const fetchRuns = useCallback(async (signal?: AbortSignal) => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            const params = new URLSearchParams();

            if (filters.status) params.set('status', filters.status);
            if (filters.month) params.set('month', String(filters.month));
            if (filters.year) params.set('year', String(filters.year));
            params.set('page', String(filters.page));
            params.set('limit', String(filters.limit));
            params.set('sortBy', sortBy);
            params.set('sortOrder', sortOrder);

            const response = await fetch(`/api/v1/payroll/runs?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                signal,
            });

            if (!response.ok) {
                throw new Error('Failed to fetch payroll runs');
            }

            const result = await response.json();
            const data: Paginated<PayrollRunDto> = result.data || result;

            setRuns(data.data);
            setTotal(data.total);

            // Find current month run
            const currentRun = data.data.find(
                (run) =>
                    run.month === `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}` ||
                    (run.year === currentPeriod.year && parseInt(run.month.split('-')[1]) === currentPeriod.month)
            );
            setCurrentMonthRun(currentRun || null);

            // Check if we need to poll
            const hasProcessing = data.data.some((r) => r.status === PayrollRunStatus.PROCESSING);
            if (hasProcessing && !pollingRef.current) {
                startPolling();
            } else if (!hasProcessing && pollingRef.current) {
                stopPolling();
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    }, [filters, sortBy, sortOrder, currentPeriod]);

    // Fetch statistics
    const fetchStats = useCallback(async () => {
        setIsStatsLoading(true);

        try {
            const token = getAuthToken();

            // Fetch current month summary
            const thisMonthRes = await fetch(
                `/api/v1/payroll/summary?month=${String(currentPeriod.month).padStart(2, '0')}&year=${currentPeriod.year}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Fetch last month summary
            const lastMonth = currentPeriod.month === 1 ? 12 : currentPeriod.month - 1;
            const lastMonthYear = currentPeriod.month === 1 ? currentPeriod.year - 1 : currentPeriod.year;
            const lastMonthRes = await fetch(
                `/api/v1/payroll/summary?month=${String(lastMonth).padStart(2, '0')}&year=${lastMonthYear}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            let thisMonthData = { netPayout: 0, totalEmployeesPaid: 0 };
            let lastMonthData = { netPayout: 0 };

            if (thisMonthRes.ok) {
                const result = await thisMonthRes.json();
                thisMonthData = result.data || result;
            }

            if (lastMonthRes.ok) {
                const result = await lastMonthRes.json();
                lastMonthData = result.data || result;
            }

            // Count pending approvals
            const pendingRes = await fetch(
                `/api/v1/payroll/runs?status=PROCESSING&limit=100`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            let pendingCount = 0;
            if (pendingRes.ok) {
                const result = await pendingRes.json();
                pendingCount = (result.data || result).total || (result.data || result).data?.length || 0;
            }

            setStats({
                thisMonthNet: thisMonthData.netPayout,
                lastMonthNet: lastMonthData.netPayout,
                averageSalary: thisMonthData.totalEmployeesPaid > 0
                    ? thisMonthData.netPayout / thisMonthData.totalEmployeesPaid
                    : 0,
                pendingApprovals: pendingCount,
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setStats({
                thisMonthNet: 0,
                lastMonthNet: 0,
                averageSalary: 0,
                pendingApprovals: 0,
            });
        } finally {
            setIsStatsLoading(false);
        }
    }, [currentPeriod]);

    // Polling for processing runs
    const startPolling = useCallback(() => {
        if (pollingRef.current) return;

        pollingRef.current = setInterval(() => {
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            fetchRuns(abortControllerRef.current.signal);
        }, 5000);
    }, [fetchRuns]);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchRuns();
        fetchStats();

        return () => {
            stopPolling();
            abortControllerRef.current?.abort();
        };
    }, [fetchRuns, fetchStats, stopPolling]);

    // Handle sorting
    const handleSort = useCallback((column: string) => {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(column);
            setSortOrder('DESC');
        }
    }, [sortBy]);

    // Handle actions
    const handleAction = useCallback(async (action: string, run: PayrollRunDto) => {
        if (action === 'view') {
            router.push(`/dashboard/payroll/runs/${run.runId}`);
            return;
        }

        if (action === 'export') {
            const token = getAuthToken();
            window.open(`/api/v1/payroll/runs/${run.runId}/export?token=${token}`, '_blank');
            return;
        }

        if (action === 'report') {
            // Similar to export but for PDF
            return;
        }

        // Actions requiring confirmation
        if (action === 'cancel') {
            const reason = prompt('Please provide a reason for cancellation:');
            if (!reason) return;

            setActionLoading(`${action}-${run.runId}`);
            try {
                const token = getAuthToken();
                const response = await fetch(`/api/v1/payroll/runs/${run.runId}/cancel`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ reason }),
                });

                if (response.ok) {
                    fetchRuns();
                    fetchStats();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Action failed');
                }
            } catch (err) {
                alert('Failed to cancel payroll run');
            } finally {
                setActionLoading(null);
            }
            return;
        }

        // Process or approve
        if (action === 'process' || action === 'approve') {
            if (!confirm(`Are you sure you want to ${action} this payroll run?`)) return;

            setActionLoading(`${action}-${run.runId}`);
            try {
                const token = getAuthToken();
                const response = await fetch(`/api/v1/payroll/runs/${run.runId}/${action}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    fetchRuns();
                    fetchStats();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Action failed');
                }
            } catch (err) {
                alert(`Failed to ${action} payroll run`);
            } finally {
                setActionLoading(null);
            }
        }
    }, [router, fetchRuns, fetchStats]);

    // Clear filters
    const clearFilters = useCallback(() => {
        router.push('/dashboard/payroll', { scroll: false });
    }, [router]);

    const hasActiveFilters = filters.status || filters.month || filters.year;

    // Generate year options
    const yearOptions = useMemo(() => {
        const years: number[] = [];
        for (let i = currentPeriod.year; i >= currentPeriod.year - 6; i--) {
            years.push(i);
        }
        return years;
    }, [currentPeriod.year]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            Payroll Management
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Manage payroll runs and employee compensation
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => router.push('/dashboard/payroll/components')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Salary Components
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/payroll/new')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Payroll Run
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="This Month Net"
                        value={formatCurrency(stats?.thisMonthNet || 0)}
                        icon={<DollarSign className="w-6 h-6 text-green-600" />}
                        iconBg="bg-green-100"
                        isLoading={isStatsLoading}
                    />
                    <StatCard
                        title="Last Month Net"
                        value={formatCurrency(stats?.lastMonthNet || 0)}
                        icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
                        iconBg="bg-blue-100"
                        isLoading={isStatsLoading}
                    />
                    <StatCard
                        title="Average Salary"
                        value={formatCurrency(stats?.averageSalary || 0)}
                        icon={<Users className="w-6 h-6 text-purple-600" />}
                        iconBg="bg-purple-100"
                        isLoading={isStatsLoading}
                    />
                    <StatCard
                        title="Pending Approvals"
                        value={stats?.pendingApprovals || 0}
                        icon={<Clock className="w-6 h-6 text-orange-600" />}
                        iconBg="bg-orange-100"
                        isLoading={isStatsLoading}
                    />
                </div>

                {/* Current Month Highlight */}
                <CurrentMonthCard
                    run={currentMonthRun}
                    periodTitle={`${currentPeriod.monthName} ${currentPeriod.year} Payroll`}
                    canProcess={currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER'}
                    onProcess={() => currentMonthRun && handleAction('process', currentMonthRun)}
                    onViewDetails={() =>
                        currentMonthRun && router.push(`/dashboard/payroll/runs/${currentMonthRun.runId}`)
                    }
                    onCreate={() => router.push('/dashboard/payroll/new')}
                    isLoading={isLoading}
                />

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-700">Filters</span>
                        </div>

                        {/* Status filter */}
                        <select
                            value={filters.status || ''}
                            onChange={(e) => updateFilters({ status: e.target.value as PayrollRunStatus || undefined, page: 1 })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            {Object.values(PayrollRunStatus).map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>

                        {/* Year filter */}
                        <select
                            value={filters.year || ''}
                            onChange={(e) => updateFilters({ year: e.target.value ? parseInt(e.target.value) : undefined, page: 1 })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Years</option>
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        {/* Month filter */}
                        <select
                            value={filters.month || ''}
                            onChange={(e) => updateFilters({ month: e.target.value ? parseInt(e.target.value) : undefined, page: 1 })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Months</option>
                            {MONTH_NAMES.map((month, i) => (
                                <option key={i} value={i + 1}>{month}</option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                <X className="w-4 h-4" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">{error}</span>
                        </div>
                        <button
                            onClick={() => fetchRuns()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && runs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No payroll runs yet
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {hasActiveFilters
                                ? 'No runs match your filters'
                                : 'Get started by creating your first payroll run'}
                        </p>
                        {!hasActiveFilters && (
                            <button
                                onClick={() => router.push('/dashboard/payroll/new')}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                Create First Payroll Run
                            </button>
                        )}
                    </div>
                )}

                {/* Table */}
                {(isLoading || runs.length > 0) && (
                    <PayrollTable
                        runs={runs}
                        isLoading={isLoading}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        currentUserRole={currentUserRole}
                        onAction={handleAction}
                    />
                )}

                {/* Pagination */}
                {!isLoading && runs.length > 0 && (
                    <PayrollPagination
                        page={filters.page}
                        limit={filters.limit}
                        total={total}
                        onPageChange={(page) => updateFilters({ page })}
                        onLimitChange={(limit) => updateFilters({ limit, page: 1 })}
                    />
                )}
            </div>
        </div>
    );
}
