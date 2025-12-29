"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Zap, Droplets, Flame, Eye, EyeOff, Loader2 } from "lucide-react";
import authApi from "@/lib/auth-api";

// Form validation schema
const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.login(data);
      router.push("/dashboard");
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Government Utility Management System
          </h1>
          <p className="mt-2 text-primary-100">
            Efficient management of water, electricity, and gas utilities
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Droplets className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Water Management
              </h3>
              <p className="text-sm text-primary-100">
                Track water consumption, manage billing, and monitor
                distribution networks
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Electricity Management
              </h3>
              <p className="text-sm text-primary-100">
                Monitor power consumption, handle meter readings, and process
                payments
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Gas Management
              </h3>
              <p className="text-sm text-primary-100">
                Oversee gas distribution, track usage, and manage service
                connections
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-200">
          © 2024 Government Utility Services. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Utility Management System
            </h1>
            <p className="mt-1 text-sm text-gray-600">Employee Portal</p>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome Back
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Sign in to your employee account
              </p>
            </div>

            <div className="card-body">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Username/Email Field */}
                <div>
                  <label htmlFor="usernameOrEmail" className="label">
                    Username or Email
                  </label>
                  <input
                    id="usernameOrEmail"
                    type="text"
                    autoComplete="username"
                    className={`input ${
                      errors.usernameOrEmail ? "input-error" : ""
                    }`}
                    placeholder="Enter your username or email"
                    {...register("usernameOrEmail")}
                  />
                  {errors.usernameOrEmail && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.usernameOrEmail.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className={`input pr-10 ${
                        errors.password ? "input-error" : ""
                      }`}
                      placeholder="Enter your password"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Having trouble signing in?{" "}
            <a
              href="#"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Contact IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
