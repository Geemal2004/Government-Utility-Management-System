'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Loader2,
    Sparkles,
    Check,
    X,
    ChevronRight,
    User,
    Briefcase,
    Lock,
    Settings,
} from 'lucide-react';
import {
    createEmployeeSchema,
    CreateEmployeeFormData,
    defaultFormValues,
    generateEmployeeNo,
    generateUsername,
} from '@/lib/validations/employee';
import {
    FormInput,
    FormSelect,
    PasswordInput,
    FormSection,
} from '@/components/employees/FormInputs';
import { RoleSpecificFields } from '@/components/employees/RoleFields';
import { ALL_ROLES, ROLE_LABELS } from '@/types/employee';

interface Department {
    departmentId: number;
    name: string;
}

// Get auth token
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export default function AddEmployeePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<{ employeeNo: string } | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isValid },
    } = useForm<CreateEmployeeFormData>({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: defaultFormValues as CreateEmployeeFormData,
        mode: 'onChange',
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'phoneNumbers',
    });

    const watchedRole = watch('role');
    const watchedFirstName = watch('firstName');
    const watchedLastName = watch('lastName');
    const watchedUsername = watch('username');
    const watchedPassword = watch('password');

    // Fetch departments
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const token = getAuthToken();
                const response = await fetch('/api/v1/departments', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const result = await response.json();
                    setDepartments(result.data || result);
                }
            } catch (err) {
                console.error('Failed to fetch departments:', err);
            }
        };
        fetchDepartments();
    }, []);

    // Check username availability (debounced)
    useEffect(() => {
        if (!watchedUsername || watchedUsername.length < 4) {
            setUsernameAvailable(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsCheckingUsername(true);
            try {
                const token = getAuthToken();
                const response = await fetch(
                    `/api/v1/employees/check-username?username=${encodeURIComponent(watchedUsername)}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (response.ok) {
                    const result = await response.json();
                    setUsernameAvailable(result.available !== false);
                }
            } catch (err) {
                setUsernameAvailable(null);
            } finally {
                setIsCheckingUsername(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [watchedUsername]);

    // Auto-generate employee number
    const handleAutoGenerateEmpNo = useCallback(() => {
        setValue('employeeNo', generateEmployeeNo(), { shouldValidate: true });
    }, [setValue]);

    // Auto-suggest username
    const handleSuggestUsername = useCallback(() => {
        if (watchedFirstName && watchedLastName) {
            const suggested = generateUsername(watchedFirstName, watchedLastName);
            setValue('username', suggested, { shouldValidate: true });
        }
    }, [watchedFirstName, watchedLastName, setValue]);

    // Form submission
    const onSubmit = async (data: CreateEmployeeFormData) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const token = getAuthToken();

            // Prepare payload
            const payload = {
                firstName: data.firstName,
                middleName: data.middleName || null,
                lastName: data.lastName,
                email: data.email,
                phone: data.phoneNumbers[0]?.number,
                employeeNo: data.employeeNo,
                designation: data.designation,
                departmentId: data.departmentId,
                role: data.role,
                username: data.username,
                password: data.password,
                // Role-specific fields
                ...(data.role === 'MANAGER' && {
                    managementLevel: data.managementLevel,
                    reportAccessLevel: data.reportAccessLevel,
                }),
                ...(data.role === 'FIELD_OFFICER' && {
                    serviceAreaType: data.serviceAreaType,
                    shiftType: data.shiftType,
                    certificationLevel: data.certificationLevel,
                    geographicArea: data.geographicArea,
                }),
                ...(data.role === 'METER_READER' && {
                    deviceId: data.deviceId,
                    assignedRouteCode: data.assignedRouteCode,
                }),
                ...(data.role === 'CASHIER' && {
                    canOverrideCharges: data.canOverrideCharges,
                    canApproveRefunds: data.canApproveRefunds,
                }),
                ...(data.role === 'ADMINISTRATIVE_STAFF' && {
                    canRegisterConnections: data.canRegisterConnections,
                    canManageTariffs: data.canManageTariffs,
                }),
            };

            const response = await fetch('/api/v1/employees', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create employee');
            }

            const result = await response.json();
            setSubmitSuccess({ employeeNo: data.employeeNo });
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success state
    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Employee Registered!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Employee <span className="font-semibold">{submitSuccess.employeeNo}</span> has been
                        successfully registered.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/dashboard/employees')}
                            className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Return to Employee List
                        </button>
                        <button
                            onClick={() => {
                                setSubmitSuccess(null);
                                window.location.reload();
                            }}
                            className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Add Another Employee
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <button
                                    onClick={() => router.push('/dashboard/employees')}
                                    className="hover:text-blue-600"
                                >
                                    Employees
                                </button>
                                <ChevronRight className="w-4 h-4" />
                                <span className="text-gray-700">New</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Register New Employee
                            </h1>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/employees')}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Section 1: Personal Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Personal Information
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Basic details about the employee
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInput
                                    label="First Name"
                                    required
                                    {...register('firstName')}
                                    error={errors.firstName?.message}
                                    placeholder="John"
                                />
                                <FormInput
                                    label="Middle Name"
                                    {...register('middleName')}
                                    error={errors.middleName?.message}
                                    placeholder="Michael"
                                />
                                <FormInput
                                    label="Last Name"
                                    required
                                    {...register('lastName')}
                                    error={errors.lastName?.message}
                                    placeholder="Doe"
                                />
                            </div>

                            <FormInput
                                label="Email"
                                type="email"
                                required
                                {...register('email')}
                                error={errors.email?.message}
                                placeholder="john.doe@company.com"
                            />

                            {/* Dynamic Phone Numbers */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Phone Numbers <span className="text-red-500">*</span>
                                </label>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2">
                                        <div className="flex-1">
                                            <Controller
                                                control={control}
                                                name={`phoneNumbers.${index}.number`}
                                                render={({ field }) => (
                                                    <input
                                                        {...field}
                                                        className={`w-full px-4 py-2.5 border rounded-lg text-sm ${errors.phoneNumbers?.[index]?.number
                                                                ? 'border-red-300 bg-red-50'
                                                                : 'border-gray-300'
                                                            }`}
                                                        placeholder="+94 77 1234567"
                                                    />
                                                )}
                                            />
                                        </div>
                                        <select
                                            {...register(`phoneNumbers.${index}.type`)}
                                            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                                        >
                                            <option value="MOBILE">Mobile</option>
                                            <option value="WORK">Work</option>
                                            <option value="HOME">Home</option>
                                        </select>
                                        {fields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {errors.phoneNumbers && (
                                    <p className="text-sm text-red-600">
                                        {errors.phoneNumbers.message || errors.phoneNumbers[0]?.number?.message}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => append({ number: '', type: 'MOBILE' })}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add phone number
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Employment Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Employment Details
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Job role and department information
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Employee Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            {...register('employeeNo')}
                                            className={`flex-1 px-4 py-2.5 border rounded-lg text-sm ${errors.employeeNo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="EMP-1234"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAutoGenerateEmpNo}
                                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Auto
                                        </button>
                                    </div>
                                    {errors.employeeNo && (
                                        <p className="text-sm text-red-600">{errors.employeeNo.message}</p>
                                    )}
                                </div>

                                <FormInput
                                    label="Designation"
                                    required
                                    {...register('designation')}
                                    error={errors.designation?.message}
                                    placeholder="e.g., Senior Billing Officer"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Controller
                                    control={control}
                                    name="departmentId"
                                    render={({ field }) => (
                                        <FormSelect
                                            label="Department"
                                            required
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            error={errors.departmentId?.message}
                                            placeholder="Select department"
                                            options={departments.map((d) => ({
                                                value: d.departmentId,
                                                label: d.name,
                                            }))}
                                        />
                                    )}
                                />

                                <FormSelect
                                    label="Base Role"
                                    required
                                    {...register('role')}
                                    error={errors.role?.message}
                                    placeholder="Select role"
                                    options={ALL_ROLES.map((role) => ({
                                        value: role,
                                        label: ROLE_LABELS[role],
                                    }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Login Credentials */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Lock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Login Credentials
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Account access credentials
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            {...register('username')}
                                            className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm ${errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="johndoe"
                                        />
                                        {isCheckingUsername && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                                        )}
                                        {!isCheckingUsername && usernameAvailable === true && (
                                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                        )}
                                        {!isCheckingUsername && usernameAvailable === false && (
                                            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSuggestUsername}
                                        disabled={!watchedFirstName || !watchedLastName}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Suggest
                                    </button>
                                </div>
                                {errors.username && (
                                    <p className="text-sm text-red-600">{errors.username.message}</p>
                                )}
                                {usernameAvailable === false && (
                                    <p className="text-sm text-red-600">Username is already taken</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Controller
                                    control={control}
                                    name="password"
                                    render={({ field }) => (
                                        <PasswordInput
                                            label="Password"
                                            required
                                            showStrength
                                            {...field}
                                            error={errors.password?.message}
                                            placeholder="Enter password"
                                        />
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <PasswordInput
                                            label="Confirm Password"
                                            required
                                            {...field}
                                            error={errors.confirmPassword?.message}
                                            placeholder="Confirm password"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Role-Specific Fields */}
                    {watchedRole && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-teal-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {ROLE_LABELS[watchedRole]} Settings
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Role-specific configuration
                                    </p>
                                </div>
                            </div>

                            <RoleSpecificFields
                                register={register}
                                errors={errors}
                                watch={watch}
                            />
                        </div>
                    )}

                    {/* Error Message */}
                    {submitError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                            <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-red-700">{submitError}</p>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/employees')}
                            className="px-6 py-2.5 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Register Employee
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Animation styles */}
            <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
