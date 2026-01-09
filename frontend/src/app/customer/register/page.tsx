'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Eye, EyeOff, User, Mail, Phone, Home, Lock, Shield, CheckCircle } from 'lucide-react';

interface CustomerRegisterForm {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    address: string;
    identityRef: string;
    acceptTerms: boolean;
}

export default function CustomerRegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CustomerRegisterForm>();

    const password = watch('password');

    const onSubmit = async (data: CustomerRegisterForm) => {
        setIsLoading(true);
        setError('');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            const response = await fetch(`${apiUrl}/auth/customer/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    password: data.password,
                    address: data.address,
                    identityRef: data.identityRef,
                    customerType: 'RESIDENTIAL',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            setSuccess(true);
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/auth/customer-login');
            }, 3000);
        } catch (err) {
            console.error('Registration error:', err);
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
                    <p className="text-gray-600 mb-6">
                        Your account has been created successfully. You will be redirected to the login page shortly.
                    </p>
                    <Link
                        href="/auth/customer-login"
                        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                    {/* Left Panel - Branding */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 md:p-12 text-white hidden md:flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Shield className="w-7 h-7 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold">Customer Portal</h1>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                                Create Your Account
                            </h2>
                            <p className="text-blue-100 text-lg mb-8">
                                Register to manage your utility services online and enjoy convenient features.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-blue-100">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span>View and pay bills online</span>
                                </div>
                                <div className="flex items-center gap-3 text-blue-100">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span>Track usage history</span>
                                </div>
                                <div className="flex items-center gap-3 text-blue-100">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span>Download payment receipts</span>
                                </div>
                                <div className="flex items-center gap-3 text-blue-100">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span>24/7 account access</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/20">
                            <p className="text-sm text-blue-100">
                                Already have an account?{' '}
                                <Link href="/auth/customer-login" className="text-white font-semibold hover:underline">
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Right Panel - Registration Form */}
                    <div className="p-8 md:p-12">
                        <div className="md:hidden mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                        <p className="text-gray-600 mb-8">Fill in your details to register</p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            {...register('firstName', { required: 'First name is required' })}
                                            type="text"
                                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                                errors.firstName ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="John"
                                        />
                                    </div>
                                    {errors.firstName && (
                                        <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            {...register('lastName', { required: 'Last name is required' })}
                                            type="text"
                                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                                errors.lastName ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="Doe"
                                        />
                                    </div>
                                    {errors.lastName && (
                                        <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: 'Invalid email address',
                                            },
                                        })}
                                        type="email"
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                            errors.email ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="john.doe@example.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        {...register('phoneNumber', {
                                            required: 'Phone number is required',
                                        })}
                                        type="tel"
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                            errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="+94 77 123 4567"
                                    />
                                </div>
                                {errors.phoneNumber && (
                                    <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>
                                )}
                            </div>

                            {/* Identity Reference (NIC/Passport) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    NIC / Passport Number
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        {...register('identityRef', {
                                            required: 'Identity reference is required',
                                        })}
                                        type="text"
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                            errors.identityRef ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="123456789V"
                                    />
                                </div>
                                {errors.identityRef && (
                                    <p className="mt-1 text-xs text-red-500">{errors.identityRef.message}</p>
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <div className="relative">
                                    <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <textarea
                                        {...register('address', {
                                            required: 'Address is required',
                                        })}
                                        rows={2}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                            errors.address ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="123 Main Street, Colombo"
                                    />
                                </div>
                                {errors.address && (
                                    <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
                                )}
                            </div>

                            {/* Password Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            {...register('password', {
                                                required: 'Password is required',
                                                minLength: {
                                                    value: 8,
                                                    message: 'Password must be at least 8 characters',
                                                },
                                            })}
                                            type={showPassword ? 'text' : 'password'}
                                            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                                errors.password ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            {...register('confirmPassword', {
                                                required: 'Please confirm your password',
                                                validate: (value) =>
                                                    value === password || 'Passwords do not match',
                                            })}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-start gap-3">
                                <input
                                    {...register('acceptTerms', {
                                        required: 'You must accept the terms and conditions',
                                    })}
                                    type="checkbox"
                                    id="acceptTerms"
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                                />
                                <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                                    I agree to the{' '}
                                    <a href="#" className="text-blue-600 hover:underline">
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a href="#" className="text-blue-600 hover:underline">
                                        Privacy Policy
                                    </a>
                                </label>
                            </div>
                            {errors.acceptTerms && (
                                <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center md:hidden">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link href="/auth/customer-login" className="text-blue-600 font-semibold hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
