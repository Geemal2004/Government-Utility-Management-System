'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    X,
    User,
    Phone,
    Mail,
    DollarSign,
    FileText,
    Clock,
    AlertCircle,
    ChevronRight,
    History,
} from 'lucide-react';

interface CustomerSearchResult {
    customerId: number;
    customerCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    unpaidBillsCount: number;
    totalOutstanding: number;
    lastPaymentDate: string | null;
    connectionCount: number;
    status: 'ACTIVE' | 'SUSPENDED';
}

const RECENT_SEARCHES_KEY = 'cashier_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export default function CashierSearchCustomerPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        // Load recent searches from local storage
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse recent searches');
            }
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setCustomers([]);
            setHasSearched(false);
            return;
        }

        const timer = setTimeout(() => {
            searchCustomers(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchCustomers = async (query: string) => {
        if (!query.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            const response = await fetch(
                `/api/v1/payments/cashier/search-customer?search=${encodeURIComponent(query)}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setCustomers(data || []);

                // Add to recent searches
                addToRecentSearches(query);
            }
        } catch (error) {
            console.error('Failed to search customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToRecentSearches = (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        setRecentSearches((prev) => {
            const filtered = prev.filter((q) => q.toLowerCase() !== trimmedQuery.toLowerCase());
            const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setCustomers([]);
        setHasSearched(false);
    };

    const handleSelectCustomer = (customer: CustomerSearchResult) => {
        router.push(`/cashier/customer/${customer.customerId}/bills`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        const parts = text.split(regex);

        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <mark key={i} className="bg-yellow-200 font-semibold">
                            {part}
                        </mark>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Customer</h1>
                        <p className="text-gray-600">
                            Find customers to process payments and view bills
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by Customer Name, ID, Phone, or Email..."
                            className="w-full pl-14 pr-12 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Recent Searches */}
                    {!searchQuery && recentSearches.length > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-600">Recent Searches</p>
                                <button
                                    onClick={clearRecentSearches}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Clear History
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map((query, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSearchQuery(query)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                                    >
                                        <History className="w-4 h-4" />
                                        {query}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Searching...</p>
                    </div>
                )}

                {/* Empty Search State */}
                {!searchQuery && !hasSearched && !isLoading && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <Search className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Search for a Customer
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Enter customer details to find and process payments
                        </p>

                        <div className="max-w-md mx-auto text-left space-y-3">
                            <p className="text-sm font-semibold text-gray-700">You can search by:</p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    <span>Customer name (e.g., "John Doe")</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span>Customer ID (e.g., "CUST-00123")</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-blue-600" />
                                    <span>Phone number (e.g., "077 123 4567")</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                    <span>Email address</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* No Results State */}
                {hasSearched && !isLoading && customers.length === 0 && searchQuery && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <AlertCircle className="w-20 h-20 text-orange-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            No Customers Found
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We couldn't find any customers matching "{searchQuery}"
                        </p>

                        <div className="max-w-md mx-auto text-left space-y-2">
                            <p className="text-sm font-semibold text-gray-700">Suggestions:</p>
                            <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                                <li>Check the spelling of the search term</li>
                                <li>Try different search terms</li>
                                <li>Search by phone number instead of name</li>
                                <li>Try entering just the customer ID</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleClearSearch}
                            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                        >
                            Clear Search
                        </button>
                    </div>
                )}

                {/* Search Results */}
                {!isLoading && customers.length > 0 && (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-gray-600">
                                Found <span className="font-semibold text-gray-900">{customers.length}</span>{' '}
                                customer{customers.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customers.map((customer) => (
                                <div
                                    key={customer.customerId}
                                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 cursor-pointer"
                                    onClick={() => handleSelectCustomer(customer)}
                                >
                                    {/* Customer Header */}
                                    <div className="mb-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {highlightMatch(
                                                    `${customer.firstName} ${customer.lastName}`,
                                                    searchQuery
                                                )}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded ${customer.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {customer.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {highlightMatch(customer.customerCode, searchQuery)}
                                        </p>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-red-600" />
                                                <span className="text-sm text-gray-700">Unpaid Bills</span>
                                            </div>
                                            <span className="font-bold text-red-600">
                                                {customer.unpaidBillsCount}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-orange-600" />
                                                <span className="text-sm text-gray-700">Outstanding</span>
                                            </div>
                                            <span className="font-bold text-orange-600">
                                                {formatCurrency(customer.totalOutstanding)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm text-gray-700">Last Payment</span>
                                            </div>
                                            <span className="font-semibold text-blue-600 text-sm">
                                                {formatDate(customer.lastPaymentDate)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span>{highlightMatch(customer.phoneNumber, searchQuery)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate">
                                                {highlightMatch(customer.email, searchQuery)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User className="w-4 h-4" />
                                            <span>{customer.connectionCount} connection(s)</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectCustomer(customer);
                                        }}
                                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        View Bills & Pay
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
