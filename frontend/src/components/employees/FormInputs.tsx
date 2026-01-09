'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { getPasswordStrength } from '@/lib/validations/employee';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
    required?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, helperText, required, className, id, ...props }, ref) => {
        const inputId = id || props.name;

        return (
            <div className="space-y-1">
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                    ref={ref}
                    id={inputId}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error
                            ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 bg-white'
                        } ${className || ''}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    {...props}
                />
                {error && (
                    <p id={`${inputId}-error`} className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="text-sm text-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
    required?: boolean;
    options: Array<{ value: string | number; label: string }>;
    placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
    ({ label, error, required, options, placeholder, className, id, ...props }, ref) => {
        const selectId = id || props.name;

        return (
            <div className="space-y-1">
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-gray-700"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                    ref={ref}
                    id={selectId}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white'
                        } ${className || ''}`}
                    aria-invalid={!!error}
                    {...props}
                >
                    {placeholder && (
                        <option value="">{placeholder}</option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

FormSelect.displayName = 'FormSelect';

interface PasswordInputProps extends Omit<FormInputProps, 'type'> {
    showStrength?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ label, error, required, showStrength, value, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const strength = showStrength && typeof value === 'string' ? getPasswordStrength(value) : null;

        return (
            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="relative">
                    <input
                        ref={ref}
                        type={showPassword ? 'text' : 'password'}
                        value={value}
                        className={`w-full px-4 py-2.5 pr-12 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                            }`}
                        {...props}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>
                {showStrength && strength && typeof value === 'string' && value.length > 0 && (
                    <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${strength.color}`}
                                style={{ width: `${strength.score}%` }}
                            />
                        </div>
                        <p className={`text-xs ${strength.label === 'weak' ? 'text-red-600' :
                                strength.label === 'medium' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                            Password strength: {strength.label}
                        </p>
                    </div>
                )}
                {error && (
                    <p className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    description?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
    ({ label, description, className, ...props }, ref) => {
        return (
            <label className="flex items-start gap-3 cursor-pointer group">
                <input
                    ref={ref}
                    type="checkbox"
                    className={`mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className || ''}`}
                    {...props}
                />
                <div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {label}
                    </span>
                    {description && (
                        <p className="text-sm text-gray-500">{description}</p>
                    )}
                </div>
            </label>
        );
    }
);

FormCheckbox.displayName = 'FormCheckbox';

// Form section wrapper
interface FormSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}
