'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    FileText,
    Cable,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    ArrowRight,
    Phone,
    Mail
} from 'lucide-react';

// Mock data - replace with API calls
const mockTodayStats = {
    newApplications: 12,
    pendingApprovals: 8,
    processedToday: 15,
    customerInquiries: 5,
};

const mockPendingApplications = [
    { id: 1, type: 'New Connection', customerName: 'John Doe', phone: '0771234567', submittedAt: '10:30 AM', priority: 'normal' },
    { id: 2, type: 'Reconnection', customerName: 'Jane Smith', phone: '0777654321', submittedAt: '09:45 AM', priority: 'urgent' },
    { id: 3, type: 'New Connection', customerName: 'Robert Johnson', phone: '0779876543', submittedAt: '09:15 AM', priority: 'normal' },
    { id: 4, type: 'Account Transfer', customerName: 'Sarah Williams', phone: '0771122334', submittedAt: '08:30 AM', priority: 'normal' },
];

const mockRecentCustomers = [
    { id: 1, customerNo: 'CUST-2024-0145', name: 'Michael Brown', email: 'michael@email.com', phone: '0771234567', registeredAt: 'Today, 10:15 AM' },
    { id: 2, customerNo: 'CUST-2024-0144', name: 'Lisa Davis', email: 'lisa@email.com', phone: '0772345678', registeredAt: 'Today, 09:30 AM' },
    { id: 3, customerNo: 'CUST-2024-0143', name: 'Tom Wilson', email: 'tom@email.com', phone: '0773456789', registeredAt: 'Yesterday' },
];

function StatCard({ title, value, icon: Icon, color, subtext }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    subtext?: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
}

export default function AdminStaffDashboard() {
    const [stats, setStats] = useState(mockTodayStats);
    const [pendingApplications, setPendingApplications] = useState(mockPendingApplications);
    const [recentCustomers, setRecentCustomers] = useState(mockRecentCustomers);
    const [searchQuery, setSearchQuery] = useState('');

    // TODO: Fetch real data from API
    useEffect(() => {
        // fetch('/api/v1/applications/pending')
    }, []);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Administrative Staff Dashboard</h1>
                    <p className="text-gray-500 mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <UserPlus className="w-4 h-4" />
                    Register Customer
                </button>
            </div>

            {/* Quick Customer Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search customers by name, ID, phone, or NIC..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                        Search
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="New Applications"
                    value={stats.newApplications}
                    icon={FileText}
                    color="bg-blue-500"
                    subtext="Today"
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals}
                    icon={Clock}
                    color="bg-amber-500"
                    subtext="Awaiting action"
                />
                <StatCard
                    title="Processed Today"
                    value={stats.processedToday}
                    icon={CheckCircle2}
                    color="bg-green-500"
                />
                <StatCard
                    title="Customer Inquiries"
                    value={stats.customerInquiries}
                    icon={Phone}
                    color="bg-purple-500"
                    subtext="To respond"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    <UserPlus className="w-6 h-6" />
                    <div className="text-left">
                        <h3 className="font-semibold">New Customer</h3>
                        <p className="text-sm text-blue-100">Register new account</p>
                    </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                    <Cable className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900">New Connection</h3>
                        <p className="text-sm text-gray-500">Process application</p>
                    </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                    <FileText className="w-6 h-6 text-purple-600" />
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Applications</h3>
                        <p className="text-sm text-gray-500">View all pending</p>
                    </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                    <Users className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Customer List</h3>
                        <p className="text-sm text-gray-500">Browse customers</p>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Applications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Pending Applications</h2>
                        <a href="/dashboard/applications" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {pendingApplications.map((app) => (
                            <div key={app.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900">{app.type}</h3>
                                            {app.priority === 'urgent' && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    URGENT
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{app.customerName}</p>
                                        <p className="text-sm text-gray-500">
                                            <Phone className="w-3 h-3 inline mr-1" />
                                            {app.phone}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">{app.submittedAt}</p>
                                        <button className="mt-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium">
                                            Process
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Customers */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Recently Registered</h2>
                        <a href="/dashboard/customers" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentCustomers.map((customer) => (
                            <div key={customer.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{customer.name}</h3>
                                        <p className="text-sm text-gray-500 font-mono">{customer.customerNo}</p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-sm text-gray-500">
                                                <Mail className="w-3 h-3 inline mr-1" />
                                                {customer.email}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                <Phone className="w-3 h-3 inline mr-1" />
                                                {customer.phone}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">{customer.registeredAt}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pending Inquiries Alert */}
            {stats.customerInquiries > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-amber-800">Customer Inquiries Pending</h3>
                            <p className="text-sm text-amber-700">
                                You have {stats.customerInquiries} customer inquiries awaiting response.
                            </p>
                        </div>
                        <a href="/dashboard/inquiries" className="ml-auto text-sm font-medium text-amber-700 hover:text-amber-800 whitespace-nowrap">
                            View Inquiries →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
