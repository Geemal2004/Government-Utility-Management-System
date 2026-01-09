'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Modal } from './ProfileComponents';
import { FormInput, FormSelect, PasswordInput, FormCheckbox } from './FormInputs';
import { EmployeeDetailDto } from '@/types/employee-profile';
import { ALL_ROLES, ROLE_LABELS, EmployeeRole } from '@/types/employee';
import { getPasswordStrength } from '@/lib/validations/employee';

// Edit Profile Modal
interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: EmployeeDetailDto;
    onSave: (data: EditProfileData) => Promise<void>;
}

interface EditProfileData {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone?: string;
    designation: string;
}

export function EditProfileModal({ isOpen, onClose, employee, onSave }: EditProfileModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<EditProfileData>({
        defaultValues: {
            firstName: employee.firstName,
            middleName: employee.middleName || '',
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone || '',
            designation: employee.designation || '',
        },
    });

    const onSubmit = async (data: EditProfileData) => {
        setIsLoading(true);
        setError(null);
        try {
            await onSave(data);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                        label="First Name"
                        required
                        {...register('firstName', { required: 'Required' })}
                        error={errors.firstName?.message}
                    />
                    <FormInput
                        label="Middle Name"
                        {...register('middleName')}
                    />
                    <FormInput
                        label="Last Name"
                        required
                        {...register('lastName', { required: 'Required' })}
                        error={errors.lastName?.message}
                    />
                </div>

                <FormInput
                    label="Email"
                    type="email"
                    required
                    {...register('email', { required: 'Required' })}
                    error={errors.email?.message}
                />

                <FormInput
                    label="Phone"
                    {...register('phone')}
                    error={errors.phone?.message}
                />

                <FormInput
                    label="Designation"
                    required
                    {...register('designation', { required: 'Required' })}
                    error={errors.designation?.message}
                />

                {/* Read-only fields */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                    <p className="text-sm text-gray-500">Read-only fields</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-gray-500">Employee Number</label>
                            <p className="font-medium text-gray-700">{employee.employeeNo}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Username</label>
                            <p className="font-medium text-gray-700">{employee.username}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// Change Password Modal
interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    isSelf: boolean;
    onSave: (data: ChangePasswordData) => Promise<void>;
}

interface ChangePasswordData {
    oldPassword?: string;
    newPassword: string;
    confirmPassword: string;
}

export function ChangePasswordModal({ isOpen, onClose, isSelf, onSave }: ChangePasswordModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPasswords, setShowPasswords] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<ChangePasswordData>();

    const newPassword = watch('newPassword', '');
    const strength = getPasswordStrength(newPassword);

    const onSubmit = async (data: ChangePasswordData) => {
        if (data.newPassword !== data.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await onSave(data);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Password" size="md">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {isSelf && (
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Current Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords ? 'text' : 'password'}
                                {...register('oldPassword', { required: isSelf ? 'Required' : false })}
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg"
                                placeholder="Enter current password"
                            />
                        </div>
                        {errors.oldPassword && (
                            <p className="text-sm text-red-600">{errors.oldPassword.message}</p>
                        )}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                        type={showPasswords ? 'text' : 'password'}
                        {...register('newPassword', {
                            required: 'Required',
                            minLength: { value: 8, message: 'Minimum 8 characters' }
                        })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                        placeholder="Enter new password"
                    />
                    {newPassword && (
                        <div className="mt-2">
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${strength.color}`}
                                    style={{ width: `${strength.score}%` }}
                                />
                            </div>
                            <p className={`text-xs mt-1 ${strength.label === 'weak' ? 'text-red-600' :
                                    strength.label === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                Password strength: {strength.label}
                            </p>
                        </div>
                    )}
                    {errors.newPassword && (
                        <p className="text-sm text-red-600">{errors.newPassword.message}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                        type={showPasswords ? 'text' : 'password'}
                        {...register('confirmPassword', { required: 'Required' })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                        placeholder="Confirm new password"
                    />
                    {errors.confirmPassword && (
                        <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showPasswords}
                        onChange={(e) => setShowPasswords(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    Show passwords
                </label>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Change Password
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// Assign Role Modal
interface AssignRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRole: EmployeeRole;
    onSave: (data: AssignRoleData) => Promise<void>;
}

interface AssignRoleData {
    role: EmployeeRole;
    roleData?: Record<string, any>;
}

export function AssignRoleModal({ isOpen, onClose, currentRole, onSave }: AssignRoleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<EmployeeRole>(currentRole);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onSave({ role: selectedRole });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign role');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Role" size="md">
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Role
                    </label>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as EmployeeRole)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    >
                        {ALL_ROLES.map((role) => (
                            <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> Changing the role will update the employee's permissions immediately.
                    </p>
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || selectedRole === currentRole}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Assign Role
                    </button>
                </div>
            </div>
        </Modal>
    );
}
