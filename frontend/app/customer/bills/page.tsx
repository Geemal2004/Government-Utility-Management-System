'use client';

import { useEffect, useState } from 'react';
import { withCustomerAuth } from '@/components/withCustomerAuth';
import { getCustomerAuthHeader } from '@/lib/auth/customerAuth';
import {
    Filter,
    Download,
    Eye,
    CreditCard,
    Calendar,
    CheckCircle,
    AlertTriangle,
    Clock,
    X,
} from 'lucide-react';

interface CustomerBill {
    billId: number;
    billNumber: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    dueDate: string;
    meterNumber: string;
    utilityType: string;
    totalAmount: number;
    amountPaid: number;
    outstandingAmount: number;
    status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIALLY_PAID';
    isOverdue: boolean;
    daysOverdue?: number;
}

type FilterStatus = 'ALL' | 'UNPAID' | 'PAID' | 'OVERDUE';
type FilterUtility = 'ALL' | 'WATER' | 'ELECTRICITY' | 'GAS';
type SortBy = 'dueDate' | 'billDate' | 'amount';

function CustomerBillsPage() {
    const [bills, setBills] = useState<CustomerBill[]>([]);
    const [filteredBills, setFilteredBills] = useState<CustomerBill[]>([]);
    const [selectedBillIds, setSelectedBillIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
    const [filterUtility, setFilterUtility] = useState<FilterUtility>('ALL');
    const [sortBy, setSortBy] = useState<SortBy>('dueDate');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBillForDetails, setSelectedBillForDetails] = useState<CustomerBill | null>(null);

    const MAX_BILLS_PER_PAYMENT = 10;

    useEffect(() => {
        fetchBills();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [bills, filterStatus, filterUtility, sortBy]);

    const fetchBills = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/payments/customer/my-bills', {
                headers: getCustomerAuthHeader(),
            });

            if (response.ok) {
                const data = await response.json();
                setBills(data.bills || []);
            }
        } catch (error) {
            console.error('Failed to fetch bills:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFiltersAndSort = () => {
        let filtered = [...bills];

        // Apply status filter
        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(bill => bill.status === filterStatus);
        }

        // Apply utility filter
        if (filterUtility !== 'ALL') {
            filtered = filtered.filter(bill => bill.utilityType === filterUtility);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'dueDate':
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                case 'billDate':
                    return new Date(a.billingPeriodStart).getTime() - new Date(b.billingPeriodStart).getTime();
                case 'amount':
                    return b.outstandingAmount - a.outstandingAmount;
                default:
                    return 0;
            }
        });

        setFilteredBills(filtered);
    };

    const toggleBillSelection = (billId: number) => {
        const newSelection = new Set(selectedBillIds);

        if (newSelection.has(billId)) {
            newSelection.delete(billId);
        } else {
            if (newSelection.size >= MAX_BILLS_PER_PAYMENT) {
                alert(`You can select maximum ${MAX_BILLS_PER_PAYMENT} bills per payment`);
                return;
            }
            newSelection.add(billId);
        }

        setSelectedBillIds(newSelection);
    };

    const selectAllUnpaid = () => {
        const unpaidBills = filteredBills.filter(bill =>
            bill.status === 'UNPAID' || bill.status === 'OVERDUE'
        );

        const billsToSelect = unpaidBills.slice(0, MAX_BILLS_PER_PAYMENT);
        setSelectedBillIds(new Set(billsToSelect.map(b => b.billId)));
    };

    const clearSelection = () => {
        setSelectedBillIds(new Set());
    };

    const calculateSelectedTotal = () => {
        return bills
            .filter(bill => selectedBillIds.has(bill.billId))
            .reduce((sum, bill) => sum + bill.outstandingAmount, 0);
    };

    const handlePaySelected = async () => {
        const selectedBills = Array.from(selectedBillIds);

        if (selectedBills.length === 0) {
            alert('Please select at least one bill');
            return;
        }

        // Redirect to payment page with selected bills
        const billIdsParam = selectedBills.join(',');
        window.location.href = `/customer/pay?bills=${billIdsParam}`;
    };

    const handlePaySingle = (billId: number) => {
        window.location.href = `/customer/pay?bills=${billId}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (bill: CustomerBill) => {
        const badges = {
            PAID: (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> PAID
                </span>
            ),
            UNPAID: (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> UNPAID
                </span>
            ),
            OVERDUE: (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> OVERDUE ({bill.daysOverdue} days)
                </span>
            ),
            PARTIALLY_PAID: (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    PARTIAL
                </span>
            ),
        };

        return badges[bill.status];
    };

    const totalOutstanding = bills.reduce((sum, bill) => sum + bill.outstandingAmount, 0);
    const selectedTotal = calculateSelectedTotal();
    const selectedCount = selectedBillIds.size;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">My Bills</h1>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600 mb-1">Total Outstanding</p>
                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalOutstanding)}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-600 mb-1">Total Bills</p>
                            <p className="text-2xl font-bold text-green-900">{bills.length}</p>
                        </div>
                        {selectedCount > 0 && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-purple-600 mb-1">{selectedCount} Bills Selected</p>
                                <p className="text-2xl font-bold text-purple-900">{formatCurrency(selectedTotal)}</p>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ALL">All</option>
                                        <option value="UNPAID">Unpaid</option>
                                        <option value="PAID">Paid</option>
                                        <option value="OVERDUE">Overdue</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Utility Type</label>
                                    <select
                                        value={filterUtility}
                                        onChange={(e) => setFilterUtility(e.target.value as FilterUtility)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ALL">All</option>
                                        <option value="ELECTRICITY">Electricity</option>
                                        <option value="WATER">Water</option>
                                        <option value="GAS">Gas</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="dueDate">Due Date</option>
                                        <option value="billDate">Bill Date</option>
                                        <option value="amount">Amount</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bills List */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Bulk Actions */}
                {filteredBills.some(b => b.status === 'UNPAID' || b.status === 'OVERDUE') && (
                    <div className="mb-4 flex items-center gap-4">
                        <button
                            onClick={selectAllUnpaid}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Select All Unpaid (max {MAX_BILLS_PER_PAYMENT})
                        </button>
                        {selectedCount > 0 && (
                            <button
                                onClick={clearSelection}
                                className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                            >
                                <X className="w-4 h-4" /> Clear Selection
                            </button>
                        )}
                    </div>
                )}

                {filteredBills.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No bills found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12"></th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill #</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Meter</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Utility</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Outstanding</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredBills.map(bill => (
                                        <tr key={bill.billId} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                {bill.status !== 'PAID' && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBillIds.has(bill.billId)}
                                                        onChange={() => toggleBillSelection(bill.billId)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-4 py-4 font-medium text-gray-900">{bill.billNumber}</td>
                                            <td className="px-4 py-4 text-sm text-gray-600">
                                                {formatDate(bill.billingPeriodStart)} - {formatDate(bill.billingPeriodEnd)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600">{formatDate(bill.dueDate)}</td>
                                            <td className="px-4 py-4 text-sm text-gray-600">{bill.meterNumber}</td>
                                            <td className="px-4 py-4 text-sm text-gray-600">{bill.utilityType}</td>
                                            <td className="px-4 py-4 font-semibold text-gray-900">
                                                {formatCurrency(bill.outstandingAmount)}
                                            </td>
                                            <td className="px-4 py-4">{getStatusBadge(bill)}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedBillForDetails(bill)}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {bill.status !== 'PAID' && (
                                                        <button
                                                            onClick={() => handlePaySingle(bill.billId)}
                                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                                                        >
                                                            Pay
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {filteredBills.map(bill => (
                                <div
                                    key={bill.billId}
                                    className={`bg-white rounded-xl p-4 shadow-lg border-2 ${bill.isOverdue ? 'border-red-200' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {bill.status !== 'PAID' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBillIds.has(bill.billId)}
                                                    onChange={() => toggleBillSelection(bill.billId)}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                            )}
                                            <h3 className="font-bold text-gray-900">{bill.billNumber}</h3>
                                        </div>
                                        {getStatusBadge(bill)}
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Billing Period:</span>
                                            <span className="font-medium">
                                                {formatDate(bill.billingPeriodStart)} - {formatDate(bill.billingPeriodEnd)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Due Date:</span>
                                            <span className={`font-medium ${bill.isOverdue ? 'text-red-600' : ''}`}>
                                                {formatDate(bill.dueDate)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Meter:</span>
                                            <span className="font-medium">{bill.meterNumber}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Utility:</span>
                                            <span className="font-medium">{bill.utilityType}</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Outstanding:</span>
                                            <span className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(bill.outstandingAmount)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedBillForDetails(bill)}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Details
                                        </button>
                                        {bill.status !== 'PAID' && (
                                            <button
                                                onClick={() => handlePaySingle(bill.billId)}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                Pay Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Payment Bar (Mobile) */}
            {selectedCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 z-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-sm text-gray-600">{selectedCount} bills selected</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedTotal)}</p>
                            </div>
                            <button
                                onClick={handlePaySelected}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <CreditCard className="w-5 h-5" />
                                Pay {formatCurrency(selectedTotal)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bill Details Modal */}
            {selectedBillForDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Bill Details</h2>
                            <button
                                onClick={() => setSelectedBillForDetails(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Bill Number</p>
                                        <p className="font-semibold">{selectedBillForDetails.billNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        {getStatusBadge(selectedBillForDetails)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Amount</p>
                                        <p className="font-semibold">{formatCurrency(selectedBillForDetails.totalAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Outstanding</p>
                                        <p className="font-semibold text-blue-600">
                                            {formatCurrency(selectedBillForDetails.outstandingAmount)}
                                        </p>
                                    </div>
                                </div>

                                {selectedBillForDetails.status !== 'PAID' && (
                                    <button
                                        onClick={() => handlePaySingle(selectedBillForDetails.billId)}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                                    >
                                        Pay Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withCustomerAuth(CustomerBillsPage);
