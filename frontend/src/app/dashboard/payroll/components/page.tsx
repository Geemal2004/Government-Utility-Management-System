'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    AlertCircle,
    RefreshCw,
    DollarSign,
    TrendingDown,
    X,
} from 'lucide-react';
import { Modal, ConfirmModal } from '@/components/employees/ProfileComponents';

// Types
interface SalaryComponentType {
    componentTypeId: number;
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    description?: string;
    isActive: boolean;
    createdAt: string;
}

// Get auth token
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export default function SalaryComponentsPage() {
    const router = useRouter();
    const [components, setComponents] = useState<SalaryComponentType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingComponent, setEditingComponent] = useState<SalaryComponentType | null>(null);
    const [deletingComponent, setDeletingComponent] = useState<SalaryComponentType | null>(null);
    const [addType, setAddType] = useState<'EARNING' | 'DEDUCTION'>('EARNING');

    // Fetch components
    const fetchComponents = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            const response = await fetch('/api/v1/payroll/components', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch salary components');
            }

            const result = await response.json();
            setComponents(result.data || result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComponents();
    }, [fetchComponents]);

    // Separate earnings and deductions
    const earnings = components.filter((c) => c.type === 'EARNING');
    const deductions = components.filter((c) => c.type === 'DEDUCTION');

    // Handle add
    const handleAdd = (type: 'EARNING' | 'DEDUCTION') => {
        setAddType(type);
        setShowAddModal(true);
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deletingComponent) return;

        try {
            const token = getAuthToken();
            const response = await fetch(
                `/api/v1/payroll/components/${deletingComponent.componentTypeId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to delete component');
            }

            fetchComponents();
            setDeletingComponent(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete');
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchComponents}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <button
                            onClick={() => router.push('/dashboard/payroll')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Payroll
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">Salary Components</h1>
                        <p className="text-gray-500">Configure earning and deduction types</p>
                    </div>
                    <button
                        onClick={() => handleAdd('EARNING')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Component
                    </button>
                </div>

                {/* Earnings Section */}
                <ComponentSection
                    title="Earnings"
                    icon={<DollarSign className="w-5 h-5 text-green-600" />}
                    iconBg="bg-green-100"
                    items={earnings}
                    onAdd={() => handleAdd('EARNING')}
                    onEdit={setEditingComponent}
                    onDelete={setDeletingComponent}
                    addLabel="Add Earning"
                />

                {/* Deductions Section */}
                <ComponentSection
                    title="Deductions"
                    icon={<TrendingDown className="w-5 h-5 text-red-600" />}
                    iconBg="bg-red-100"
                    items={deductions}
                    onAdd={() => handleAdd('DEDUCTION')}
                    onEdit={setEditingComponent}
                    onDelete={setDeletingComponent}
                    addLabel="Add Deduction"
                />

                {/* Add/Edit Modal */}
                <ComponentModal
                    isOpen={showAddModal || !!editingComponent}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingComponent(null);
                    }}
                    component={editingComponent}
                    defaultType={addType}
                    onSave={fetchComponents}
                />

                {/* Delete Confirmation */}
                <ConfirmModal
                    isOpen={!!deletingComponent}
                    onClose={() => setDeletingComponent(null)}
                    onConfirm={handleDelete}
                    title="Delete Component"
                    message={`Are you sure you want to delete "${deletingComponent?.name}"? This cannot be undone if the component is not used in any payslips.`}
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </div>
    );
}

// Component Section
interface ComponentSectionProps {
    title: string;
    icon: React.ReactNode;
    iconBg: string;
    items: SalaryComponentType[];
    onAdd: () => void;
    onEdit: (item: SalaryComponentType) => void;
    onDelete: (item: SalaryComponentType) => void;
    addLabel: string;
}

function ComponentSection({
    title,
    icon,
    iconBg,
    items,
    onAdd,
    onEdit,
    onDelete,
    addLabel,
}: ComponentSectionProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
                <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <h2 className="font-semibold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-500">{items.length} component{items.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-gray-100">
                {items.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                        No {title.toLowerCase()} configured
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.componentTypeId}
                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                        >
                            <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                {item.description && (
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(item)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Button */}
            <div className="px-6 py-4 border-t border-gray-200">
                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    {addLabel}
                </button>
            </div>
        </div>
    );
}

// Add/Edit Modal
interface ComponentModalProps {
    isOpen: boolean;
    onClose: () => void;
    component: SalaryComponentType | null;
    defaultType: 'EARNING' | 'DEDUCTION';
    onSave: () => void;
}

function ComponentModal({
    isOpen,
    onClose,
    component,
    defaultType,
    onSave,
}: ComponentModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<'EARNING' | 'DEDUCTION'>(defaultType);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            if (component) {
                setName(component.name);
                setType(component.type);
                setDescription(component.description || '');
            } else {
                setName('');
                setType(defaultType);
                setDescription('');
            }
            setError(null);
        }
    }, [isOpen, component, defaultType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Component name is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const url = component
                ? `/api/v1/payroll/components/${component.componentTypeId}`
                : '/api/v1/payroll/components';
            const method = component ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    type,
                    description: description.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to save component');
            }

            onSave();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={component ? 'Edit Component' : 'Add Salary Component'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Component Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Housing Allowance"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                    />
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                checked={type === 'EARNING'}
                                onChange={() => setType('EARNING')}
                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <span className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                </span>
                                <span className="text-gray-900">Earning</span>
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                checked={type === 'DEDUCTION'}
                                onChange={() => setType('DEDUCTION')}
                                className="w-4 h-4 text-red-600 focus:ring-red-500"
                            />
                            <span className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                </span>
                                <span className="text-gray-900">Deduction</span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* Description (optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !name.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {component ? 'Save Changes' : 'Add Component'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
