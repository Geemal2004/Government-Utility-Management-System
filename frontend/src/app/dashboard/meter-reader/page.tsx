'use client';

import { useState, useEffect } from 'react';
import {
    MapPin,
    Gauge,
    Clock,
    CheckCircle2,
    AlertCircle,
    Navigation,
    Camera,
    ArrowRight,
    Play,
    FileText
} from 'lucide-react';

// Mock data - replace with API calls
const mockTodayStats = {
    assignedReadings: 85,
    completedReadings: 42,
    pendingReadings: 43,
    lastSyncTime: '10:35 AM',
};

const mockAssignedRoutes = [
    { id: 1, name: 'Route A - Downtown', totalMeters: 35, completed: 20, status: 'in_progress' },
    { id: 2, name: 'Route B - Industrial', totalMeters: 25, completed: 0, status: 'pending' },
    { id: 3, name: 'Route C - Residential', totalMeters: 25, completed: 22, status: 'in_progress' },
];

const mockRecentReadings = [
    { id: 1, meterNo: 'MTR-00145', customerName: 'John Doe', reading: 1254, time: '10:30 AM', status: 'synced' },
    { id: 2, meterNo: 'MTR-00148', customerName: 'Jane Smith', reading: 892, time: '10:25 AM', status: 'synced' },
    { id: 3, meterNo: 'MTR-00152', customerName: 'Robert Johnson', reading: 1567, time: '10:15 AM', status: 'pending' },
    { id: 4, meterNo: 'MTR-00156', customerName: 'Sarah Williams', reading: 743, time: '10:05 AM', status: 'synced' },
];

function StatCard({ title, value, total, icon: Icon, color }: {
    title: string;
    value: number;
    total?: number;
    icon: React.ElementType;
    color: string;
}) {
    const percentage = total ? Math.round((value / total) * 100) : null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {value}{total && <span className="text-lg text-gray-400">/{total}</span>}
                    </p>
                    {percentage !== null && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${color.replace('bg-', 'bg-')}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
}

export default function MeterReaderDashboard() {
    const [stats, setStats] = useState(mockTodayStats);
    const [routes, setRoutes] = useState(mockAssignedRoutes);
    const [recentReadings, setRecentReadings] = useState(mockRecentReadings);

    // TODO: Fetch real data from API
    useEffect(() => {
        // fetch('/api/v1/meter-readings/today-summary')
    }, []);

    const completionRate = Math.round((stats.completedReadings / stats.assignedReadings) * 100);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meter Reader Dashboard</h1>
                    <p className="text-gray-500 mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    Last sync: {stats.lastSyncTime}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Today's Progress"
                    value={stats.completedReadings}
                    total={stats.assignedReadings}
                    icon={Gauge}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Pending Readings"
                    value={stats.pendingReadings}
                    icon={Clock}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Completion Rate"
                    value={completionRate}
                    icon={CheckCircle2}
                    color="bg-green-500"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    <Gauge className="w-8 h-8" />
                    <div className="text-left">
                        <h3 className="font-semibold">Enter Reading</h3>
                        <p className="text-sm text-blue-100">Quick meter entry</p>
                    </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                    <Camera className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Scan Meter</h3>
                        <p className="text-sm text-gray-500">Use camera to scan</p>
                    </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                    <Navigation className="w-8 h-8 text-purple-600" />
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Open Map</h3>
                        <p className="text-sm text-gray-500">View route map</p>
                    </div>
                </button>
            </div>

            {/* Assigned Routes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Today's Routes</h2>
                    <a href="/dashboard/routes" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View All Routes <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
                <div className="divide-y divide-gray-100">
                    {routes.map((route) => {
                        const progress = Math.round((route.completed / route.totalMeters) * 100);
                        return (
                            <div key={route.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${route.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                                            }`}>
                                            <MapPin className={`w-5 h-5 ${route.status === 'in_progress' ? 'text-blue-600' : 'text-gray-500'
                                                }`} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{route.name}</h3>
                                            <p className="text-sm text-gray-500">{route.completed} of {route.totalMeters} meters</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${route.status === 'in_progress'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {route.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                        </span>
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Play className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Readings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Readings</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meter</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reading</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentReadings.map((reading) => (
                                <tr key={reading.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{reading.meterNo}</td>
                                    <td className="px-6 py-4 text-gray-600">{reading.customerName}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-900">{reading.reading}</td>
                                    <td className="px-6 py-4 text-gray-600">{reading.time}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${reading.status === 'synced'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {reading.status === 'synced' ? (
                                                <><CheckCircle2 className="w-3 h-3" /> Synced</>
                                            ) : (
                                                <><AlertCircle className="w-3 h-3" /> Pending</>
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
