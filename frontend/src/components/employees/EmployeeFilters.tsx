'use client';

import { useState, useCallback } from 'react';
import { Search, X, ChevronDown, Filter } from 'lucide-react';
import { EmployeeFilters, EmployeeRole, ALL_ROLES, ROLE_LABELS } from '@/types/employee';

interface Department {
    departmentId: number;
    name: string;
}

interface EmployeeFiltersProps {
    filters: EmployeeFilters;
    onFiltersChange: (filters: Partial<EmployeeFilters>) => void;
    departments: Department[];
    isLoading?: boolean;
}

export function EmployeeFiltersPanel({
    filters,
    onFiltersChange,
    departments,
    isLoading,
}: EmployeeFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [searchValue, setSearchValue] = useState(filters.search || '');

    // Debounced search handler
    const handleSearchChange = useCallback(
        (value: string) => {
            setSearchValue(value);
            const timeoutId = setTimeout(() => {
                onFiltersChange({ search: value || undefined, page: 1 });
            }, 300);
            return () => clearTimeout(timeoutId);
        },
        [onFiltersChange]
    );

    const handleDepartmentChange = (departmentId: string) => {
        onFiltersChange({
            departmentId: departmentId ? parseInt(departmentId) : undefined,
            page: 1,
        });
    };

    const handleRoleToggle = (role: EmployeeRole) => {
        const currentRoles = filters.role || [];
        const newRoles = currentRoles.includes(role)
            ? currentRoles.filter((r) => r !== role)
            : [...currentRoles, role];
        onFiltersChange({ role: newRoles.length > 0 ? newRoles : undefined, page: 1 });
    };


    const clearFilters = () => {
        setSearchValue('');
        onFiltersChange({
            search: undefined,
            departmentId: undefined,
            role: undefined,
            page: 1,
        });
    };

    const hasActiveFilters =
        filters.search ||
        filters.departmentId !== undefined ||
        (filters.role && filters.role.length > 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Filter Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-700">Filters</span>
                    {hasActiveFilters && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Active
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                        }`}
                />
            </div>

            {/* Filter Content */}
            {isExpanded && (
                <div className="p-4 space-y-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, employee no, email..."
                                value={searchValue}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {searchValue && (
                                <button
                                    onClick={() => handleSearchChange('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Department Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Department
                            </label>
                            <select
                                value={filters.departmentId || ''}
                                onChange={(e) => handleDepartmentChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isLoading}
                            >
                                <option value="">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept.departmentId} value={dept.departmentId}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                disabled={!hasActiveFilters}
                                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Role Multi-Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Roles
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {ALL_ROLES.map((role) => {
                                const isSelected = filters.role?.includes(role);
                                return (
                                    <button
                                        key={role}
                                        onClick={() => handleRoleToggle(role)}
                                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                            }`}
                                    >
                                        {ROLE_LABELS[role]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
