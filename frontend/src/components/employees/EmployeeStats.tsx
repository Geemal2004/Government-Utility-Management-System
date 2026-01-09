'use client';

import { Users, UserCheck, Building2, Briefcase } from 'lucide-react';
import { EmployeeStatsDto } from '@/types/employee';

interface EmployeeStatsCardsProps {
    stats: EmployeeStatsDto | null;
    isLoading: boolean;
}

export function EmployeeStatsCards({ stats, isLoading }: EmployeeStatsCardsProps) {
    if (isLoading) {
        return <StatsSkeleton />;
    }

    if (!stats) {
        return null;
    }

    const inactiveCount = stats.total - stats.active;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Employees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Employees</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-gray-600">{stats.active} active</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-gray-600">{inactiveCount} inactive</span>
                    </span>
                </div>
            </div>

            {/* Active Employees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Employees</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                </div>
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(stats.active / stats.total) * 100}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {((stats.active / stats.total) * 100).toFixed(1)}% of total
                    </p>
                </div>
            </div>

            {/* By Department */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">By Department</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                            {stats.byDepartment.length} Depts
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                </div>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                    {stats.byDepartment.slice(0, 3).map((dept, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 truncate max-w-[120px]">
                                {dept.departmentName}
                            </span>
                            <span className="font-medium text-gray-900">{dept.count}</span>
                        </div>
                    ))}
                    {stats.byDepartment.length > 3 && (
                        <p className="text-xs text-gray-400">
                            +{stats.byDepartment.length - 3} more
                        </p>
                    )}
                </div>
            </div>

            {/* By Role */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">By Role</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                            {stats.byRole.length} Roles
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-orange-600" />
                    </div>
                </div>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                    {stats.byRole.slice(0, 3).map((role, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{formatRole(role.role)}</span>
                            <span className="font-medium text-gray-900">{role.count}</span>
                        </div>
                    ))}
                    {stats.byRole.length > 3 && (
                        <p className="text-xs text-gray-400">
                            +{stats.byRole.length - 3} more
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatRole(role: string): string {
    return role
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="w-full h-2 bg-gray-200 rounded animate-pulse" />
                        <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
