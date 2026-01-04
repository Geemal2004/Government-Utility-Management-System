'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { setCustomerToken, setCustomerData } from '@/lib/auth/customerAuth';
import { Eye, EyeOff, Lock, Mail, Shield, FileText, Clock, TrendingUp } from 'lucide-react';

interface CustomerLoginForm {
    identifier: string;
    password: string;
    rememberMe: boolean;
}

export default function CustomerLoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CustomerLoginForm>();

    const onSubmit = async (data: CustomerLoginForm) => {
        setIsLoading(true);
        setError('');

        try {
            console.log('Starting login...');
            const response = await fetch('/api/v1/auth/customer/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier: data.identifier,
                    password: data.password,
                }),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Invalid credentials');
            }

            const responseData = await response.json();
            console.log('Response data:', responseData);

            const { accessToken, customer } = responseData.data || responseData;
            console.log('Access token:', accessToken ? 'present' : 'missing');
            console.log('Customer:', customer);

            // Store token and customer data using auth utilities
            setCustomerToken(accessToken, data.rememberMe);
            setCustomerData(customer, data.rememberMe);

            console.log('Data stored, redirecting...');

            // Force redirect using window.location instead of router
            window.location.href = '/customer/dashboard';
        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        {
            icon: <FileText className="w-6 h-6" />,
            title: 'Pay Your Bills Online',
            description: 'Quick and secure online bill payments',
        },
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: 'View Usage History',
            description: 'Track your consumption patterns',
        },
        {
            icon: <FileText className="w-6 h-6" />,
            title: 'Download Receipts',
            description: 'Access all your payment receipts',
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: '24/7 Access',
            description: 'Manage your account anytime, anywhere',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                    {/* Left Panel - Features & Branding */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 md:p-12 text-white">
                        <div className="h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                        <Shield className="w-7 h-7 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-bold">Customer Portal</h1>
                                </div>

                                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                                    Welcome Back
                                </h2>
                                <p className="text-blue-100 text-lg mb-12">
                                    Access your utility account securely and manage your services with ease.
                                </p>

                                <div className="space-y-6">
                                    {features.map((feature, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                                {feature.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white mb-1">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-sm text-blue-100">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/20">
                                <div className="flex items-center gap-2 text-sm text-blue-100">
                                    <Shield className="w-4 h-4" />
                                    <span>Secured with SSL encryption</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Login Form */}
                    <div className="p-8 md:p-12">
                        <div className="max-w-md mx-auto">
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    Sign In
                                </h2>
                                <p className="text-gray-600">
                                    Enter your credentials to access your account
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        {error}
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Customer ID / Email */}
                                <div>
                                    <label
                                        htmlFor="identifier"
                                        className="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Customer ID or Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('identifier', {
                                                required: 'Customer ID or Email is required',
                                                validate: (value) => {
                                                    // Accept either email format or customer ID (numeric)
                                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                    const isEmail = emailRegex.test(value);
                                                    const isNumeric = /^\d+$/.test(value);

                                                    if (!isEmail && !isNumeric) {
                                                        return 'Enter a valid email or Customer ID';
                                                    }
                                                    return true;
                                                },
                                            })}
                                            id="identifier"
                                            type="text"
                                            placeholder="Enter your Customer ID or Email"
                                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.identifier
                                                ? 'border-red-300 bg-red-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        />
                                    </div>
                                    {errors.identifier && (
                                        <p className="mt-2 text-sm text-red-600">
                                            {errors.identifier.message}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('password', {
                                                required: 'Password is required',
                                                minLength: {
                                                    value: 6,
                                                    message: 'Password must be at least 6 characters',
                                                },
                                            })}
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            className={`w-full pl-12 pr-12 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.password
                                                ? 'border-red-300 bg-red-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-2 text-sm text-red-600">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            {...register('rememberMe')}
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                            Remember me
                                        </span>
                                    </label>
                                    <a
                                        href="/customer/forgot-password"
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        Forgot Password?
                                    </a>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg
                                                className="animate-spin h-5 w-5"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            Signing in...
                                        </span>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>

                                {/* Register Link */}
                                <div className="text-center pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        Don't have an account?{' '}
                                        <a
                                            href="/customer/register"
                                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                            Register Now
                                        </a>
                                    </p>
                                </div>
                            </form>

                            {/* Back to Home */}
                            <div className="mt-8 text-center">
                                <a
                                    href="/"
                                    className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                                >
                                    ← Back to Home
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
