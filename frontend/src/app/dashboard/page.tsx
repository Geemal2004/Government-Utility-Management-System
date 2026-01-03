"use client";

import {
  Users,
  Cable,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Droplets,
  Zap,
  Flame,
  AlertTriangle,
} from "lucide-react";
import BillingDashboard from "@/components/BillingDashboard";

// Stat card component
function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {changeType === "increase" ? (
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
        )}
        <span
          className={`text-sm font-medium ${
            changeType === "increase" ? "text-green-600" : "text-red-600"
          }`}
        >
          {change}
        </span>
        <span className="text-sm text-gray-500 ml-1">from last month</span>
      </div>
    </div>
  );
}

// Utility card component
function UtilityCard({
  title,
  activeConnections,
  pendingBills,
  icon: Icon,
  iconColor,
  bgColor,
}: {
  title: string;
  activeConnections: number;
  pendingBills: number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <div className={`card p-6 ${bgColor}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Icon className={`h-8 w-8 ${iconColor}`} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Active Connections</p>
          <p className="text-2xl font-bold text-gray-900">
            {activeConnections.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Pending Bills</p>
          <p className="text-2xl font-bold text-gray-900">
            {pendingBills.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Recent activity item
function ActivityItem({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type: "success" | "warning" | "info";
}) {
  const colors = {
    success: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-600",
    info: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="flex items-start space-x-3 py-3">
      <div
        className={`w-2 h-2 mt-2 rounded-full ${colors[type].split(" ")[0]}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here&apos;s an overview of your utility management
          system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value="24,521"
          change="12%"
          changeType="increase"
          icon={Users}
          iconColor="bg-blue-500"
        />
        <StatCard
          title="Active Connections"
          value="45,890"
          change="8%"
          changeType="increase"
          icon={Cable}
          iconColor="bg-green-500"
        />
        <StatCard
          title="Bills Generated"
          value="12,450"
          change="5%"
          changeType="increase"
          icon={FileText}
          iconColor="bg-purple-500"
        />
        <StatCard
          title="Revenue (MTD)"
          value="$2.4M"
          change="3%"
          changeType="decrease"
          icon={CreditCard}
          iconColor="bg-orange-500"
        />
      </div>

      {/* Utility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UtilityCard
          title="Water"
          activeConnections={18543}
          pendingBills={2341}
          icon={Droplets}
          iconColor="text-blue-500"
          bgColor="bg-blue-50"
        />
        <UtilityCard
          title="Electricity"
          activeConnections={22156}
          pendingBills={3567}
          icon={Zap}
          iconColor="text-yellow-500"
          bgColor="bg-yellow-50"
        />
        <UtilityCard
          title="Gas"
          activeConnections={5191}
          pendingBills={1234}
          icon={Flame}
          iconColor="text-orange-500"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Billing Dashboard Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Billing Overview
        </h2>
        <BillingDashboard />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="card-body divide-y divide-gray-100">
            <ActivityItem
              title="New customer registered"
              description="John Smith - Residential connection"
              time="5 min ago"
              type="success"
            />
            <ActivityItem
              title="Payment received"
              description="Bill #45678 - $156.50"
              time="15 min ago"
              type="success"
            />
            <ActivityItem
              title="Meter reading submitted"
              description="Route A-15 completed by James Wilson"
              time="1 hour ago"
              type="info"
            />
            <ActivityItem
              title="Service disconnection scheduled"
              description="Account #12345 - Non-payment"
              time="2 hours ago"
              type="warning"
            />
            <ActivityItem
              title="Work order completed"
              description="WO-789 - Meter installation"
              time="3 hours ago"
              type="success"
            />
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Alerts & Notifications
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Critical: Network outage detected
                </p>
                <p className="text-sm text-red-600">
                  Water distribution in Zone 4 affected. Maintenance team
                  dispatched.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Warning: High consumption alert
                </p>
                <p className="text-sm text-yellow-600">
                  15 accounts show unusual consumption patterns this month.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Info: Scheduled maintenance
                </p>
                <p className="text-sm text-blue-600">
                  Electricity substation maintenance scheduled for Dec 30, 2024.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
