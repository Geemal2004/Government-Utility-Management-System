"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Droplets, Flame, Users, Briefcase, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const utilities = [
    {
      icon: <Droplets className="h-8 w-8" />,
      title: "Water Management",
      description: "Track water consumption and manage billing",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Electricity Management",
      description: "Monitor power consumption and meter readings",
    },
    {
      icon: <Flame className="h-8 w-8" />,
      title: "Gas Management",
      description: "Oversee gas distribution and service connections",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-700">
              Government Utility Management System
            </h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Title and Description */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to Our Utility Management Portal
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Efficient management of water, electricity, and gas utilities.
              Choose your portal to get started.
            </p>
          </div>

          {/* Login Options Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Customer Portal */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow border-2 border-transparent hover:border-primary-200">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Customer Portal
                </h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Access your account to view bills, make payments, track usage,
                  and manage your utility services online.
                </p>
                <button
                  onClick={() => router.push("/auth/customer-login")}
                  className="btn-primary w-full py-4 text-lg group"
                >
                  <span className="flex items-center justify-center">
                    Login as Customer
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  New customer?{" "}
                  <Link
                    href="/customer/register"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </div>

            {/* Employee Portal */}
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow border-2 border-transparent hover:border-primary-200">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-6">
                  <Briefcase className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Employee Portal
                </h3>
                <p className="text-gray-600 mb-6 flex-grow">
                  Staff login for managing customers, processing payments,
                  handling meter readings, and administrative tasks.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="btn-primary w-full py-4 text-lg group"
                >
                  <span className="flex items-center justify-center">
                    Login as Employee
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Authorized personnel only
                </p>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Our Utility Services
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {utilities.map((utility, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary-50 rounded-xl mx-auto mb-4">
                    <div className="text-primary-600">{utility.icon}</div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {utility.title}
                  </h4>
                  <p className="text-gray-600 text-sm">{utility.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm">
              © 2024 Government Utility Services. All rights reserved.
            </p>
            <p className="text-xs mt-2 text-gray-500">
              For technical support, please contact your system administrator.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
