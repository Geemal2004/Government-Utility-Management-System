'use client';

import { useState, useEffect } from 'react';
import {
    Wrench,
    ClipboardCheck,
    Clock,
    CheckCircle2,
    AlertCircle,
    MapPin,
    ArrowRight,
    Play,
    Calendar,
    User
} from 'lucide-react';

// Mock data - replace with API calls
const mockTodayStats = {
    activeWorkOrders: 8,
    completedToday: 5,
    pendingInspections: 3,
    overdueItems: 1,
};

const mockWorkOrders = [
    { id: 1, type: 'Leak Repair', customerName: 'John Doe', address: '123 Main St', priority: 'high', status: 'in_progress', dueTime: '11:00 AM' },
    { id: 2, type: 'New Connection', customerName: 'Jane Smith', address: '456 Oak Ave', priority: 'medium', status: 'pending', dueTime: '1:00 PM' },
    { id: 3, type: 'Meter Replacement', customerName: 'Robert Johnson', address: '789 Pine Rd', priority: 'low', status: 'pending', dueTime: '3:00 PM' },
    { id: 4, type: 'Disconnection', customerName: 'Sarah Williams', address: '321 Elm St', priority: 'high', status: 'pending', dueTime: '4:00 PM' },
];

const mockUpcomingInspections = [
    { id: 1, type: 'New Connection Inspection', customerName: 'Mike Brown', address: '555 Cedar Ln', scheduledDate: 'Today, 2:30 PM' },
    { id: 2, type: 'Meter Verification', customerName: 'Lisa Davis', address: '777 Birch Dr', scheduledDate: 'Tomorrow, 9:00 AM' },
    { id: 3, type: 'Complaint Investigation', customerName: 'Tom Wilson', address: '999 Maple Ave', scheduledDate: 'Tomorrow, 11:00 AM' },
];

function StatCard({ title, value, icon: Icon, color, alert }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    alert?: boolean;
}) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border ${alert ? 'border-red-300' : 'border-gray-200'} p-6`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
}

function getPriorityColor(priority: string) {
    switch (priority) {
        case 'high': return 'bg-red-100 text-red-700 border-red-200';
        case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'low': return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}

export default function FieldOfficerDashboard() {
    const [stats, setStats] = useState(mockTodayStats);
    const [workOrders, setWorkOrders] = useState(mockWorkOrders);
    const [inspections, setInspections] = useState(mockUpcomingInspections);

    // TODO: Fetch real data from API
    useEffect(() => {
        // fetch('/api/v1/work-orders/my-assignments')
    }, []);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Field Officer Dashboard</h1>
                    <p className="text-gray-500 mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <MapPin className="w-4 h-4" />
                    Open Route Map
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Active Work Orders"
                    value={stats.activeWorkOrders}
                    icon={Wrench}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Completed Today"
                    value={stats.completedToday}
                    icon={CheckCircle2}
                    color="bg-green-500"
                />
                <StatCard
                    title="Pending Inspections"
                    value={stats.pendingInspections}
                    icon={ClipboardCheck}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Overdue Items"
                    value={stats.overdueItems}
                    icon={AlertCircle}
                    color="bg-red-500"
                    alert={stats.overdueItems > 0}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    <Wrench className="w-8 h-8" />
                    <div className="text-left">
                        <h3 className="font-semibold">Update Work Order</h3>
                        <p className="text-sm text-blue-100">Log progress or complete</p>
                    </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                    <ClipboardCheck className="w-8 h-8 text-purple-600" />
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Submit Inspection</h3>
                        <p className="text-sm text-gray-500">Complete inspection report</p>
                    </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                    <Calendar className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900">View Schedule</h3>
                        <p className="text-sm text-gray-500">Weekly task calendar</p>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Work Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Today's Work Orders</h2>
                        <a href="/dashboard/work-orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {workOrders.map((order) => (
                            <div key={order.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900">{order.type}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(order.priority)}`}>
                                                {order.priority.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <User className="w-3 h-3 inline mr-1" />
                                            {order.customerName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            <MapPin className="w-3 h-3 inline mr-1" />
                                            {order.address}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Due: {order.dueTime}</p>
                                        <button className="mt-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Play className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Inspections */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Upcoming Inspections</h2>
                        <a href="/dashboard/inspections" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {inspections.map((inspection) => (
                            <div key={inspection.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{inspection.type}</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <User className="w-3 h-3 inline mr-1" />
                                            {inspection.customerName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            <MapPin className="w-3 h-3 inline mr-1" />
                                            {inspection.address}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                            <Calendar className="w-3 h-3" />
                                            {inspection.scheduledDate}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overdue Alert */}
            {stats.overdueItems > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-red-800">Overdue Work Orders</h3>
                            <p className="text-sm text-red-700">
                                You have {stats.overdueItems} overdue work order(s) that need immediate attention.
                            </p>
                        </div>
                        <a href="/dashboard/work-orders?filter=overdue" className="ml-auto text-sm font-medium text-red-700 hover:text-red-800 whitespace-nowrap">
                            View Overdue →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
