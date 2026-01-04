"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellAlertIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface BillingSummary {
  totalRevenue: number;
  totalRevenueLastMonth: number;
  revenueTrend: number;
  outstandingAmount: number;
  outstandingCount: number;
  overdueAmount: number;
  overdueCount: number;
  collectionRate: number;
  collectionTarget: number;
}

interface RevenueTrend {
  month: string;
  billed: number;
  collected: number;
}

interface BillsByStatus {
  status: string;
  count: number;
  percentage: number;
  amount: number;
  [key: string]: string | number;
}

interface AverageByUtility {
  utilityType: string;
  averageAmount: number;
  billCount: number;
}

interface RecentBill {
  billId: number;
  billNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  dueDate: string;
}

interface OverdueBill {
  billId: number;
  billNumber: string;
  customerId: number;
  customerName: string;
  totalAmount: number;
  daysOverdue: number;
}

const BillingDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [billsByStatus, setBillsByStatus] = useState<BillsByStatus[]>([]);
  const [averageByUtility, setAverageByUtility] = useState<AverageByUtility[]>(
    []
  );
  const [recentBills, setRecentBills] = useState<RecentBill[]>([]);
  const [overdueBills, setOverdueBills] = useState<OverdueBill[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [summaryRes, recentRes, overdueRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/bills/summary`),
        fetch(
          `${API_BASE_URL}/api/v1/bills?limit=10&sortBy=billDate&order=DESC`
        ),
        fetch(`${API_BASE_URL}/api/v1/bills/overdue?limit=5`),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data.summary);
        setRevenueTrend(summaryData.data.revenueTrend || []);
        setBillsByStatus(summaryData.data.billsByStatus || []);
        setAverageByUtility(summaryData.data.averageByUtility || []);
      }

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentBills(recentData.data.bills || []);
      }

      if (overdueRes.ok) {
        const overdueData = await overdueRes.json();
        setOverdueBills(overdueData.data || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (billId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/bills/${billId}/send-reminder`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        alert("Reminder sent successfully!");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PAID: "bg-green-100 text-green-800",
      UNPAID: "bg-yellow-100 text-yellow-800",
      OVERDUE: "bg-red-100 text-red-800",
      PARTIAL: "bg-blue-100 text-blue-800",
      VOIDED: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const PIE_COLORS = ["#22c55e", "#fbbf24", "#ef4444", "#6b7280"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary?.totalRevenue || 0)}
              </p>
              <div className="flex items-center mt-2">
                {summary && summary.revenueTrend >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span
                  className={`text-sm font-medium ${
                    summary && summary.revenueTrend >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {summary?.revenueTrend.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  from last month
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <CurrencyDollarIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Outstanding Bills Card */}
        <div
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/bills?status=UNPAID")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding Bills</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary?.outstandingAmount || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {summary?.outstandingCount || 0} bills
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Overdue Amount Card */}
        <div
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/dashboard/bills?status=OVERDUE")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Amount</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(summary?.overdueAmount || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {summary?.overdueCount || 0} bills
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Collection Rate Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.collectionRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Target: {summary?.collectionTarget}%
              </span>
              <span
                className={
                  summary && summary.collectionRate >= summary.collectionTarget
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {summary && summary.collectionRate >= summary.collectionTarget
                  ? "On Track"
                  : "Below Target"}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  summary && summary.collectionRate >= summary.collectionTarget
                    ? "bg-green-600"
                    : "bg-yellow-600"
                }`}
                style={{
                  width: `${Math.min(
                    ((summary?.collectionRate || 0) /
                      (summary?.collectionTarget || 100)) *
                      100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number | undefined) =>
                  value !== undefined ? formatCurrency(value) : ""
                }
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="billed"
                stroke="#2563eb"
                strokeWidth={2}
                name="Billed"
                dot={{ fill: "#2563eb", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="collected"
                stroke="#22c55e"
                strokeWidth={2}
                name="Collected"
                dot={{ fill: "#22c55e", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bills by Status Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bills by Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={billsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) =>
                  `${entry.status}: ${entry.percentage.toFixed(1)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {billsByStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(
                  value: number | undefined,
                  name: any,
                  props: any
                ) => [
                  value !== undefined
                    ? `${value} bills (${formatCurrency(props.payload.amount)})`
                    : "",
                  props.payload.status,
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Bill Amount by Utility Type Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Average Bill Amount by Utility Type
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={averageByUtility}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="utilityType" />
            <YAxis />
            <Tooltip
              formatter={(value: number | undefined, name: any, props: any) => [
                value !== undefined
                  ? `${formatCurrency(value)} (${
                      props.payload.billCount
                    } bills)`
                  : "",
                "Average Amount",
              ]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
              }}
            />
            <Bar dataKey="averageAmount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Bills and Overdue Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Bills
              </h3>
              <button
                onClick={() => router.push("/dashboard/bills")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bill ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentBills.map((bill) => (
                  <tr
                    key={bill.billId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/bills/${bill.billId}`)
                    }
                  >
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      #{bill.billNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {bill.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(bill.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Alerts Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <BellAlertIcon className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Overdue Alerts
                </h3>
              </div>
              <button
                onClick={() => router.push("/dashboard/bills?status=OVERDUE")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {overdueBills.length > 0 ? (
              overdueBills.map((bill) => (
                <div key={bill.billId} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {bill.customerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Bill #{bill.billNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        {formatCurrency(bill.totalAmount)}
                      </p>
                      <p className="text-sm text-red-600">
                        {bill.daysOverdue} days overdue
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendReminder(bill.billId);
                    }}
                    className="mt-2 w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                  >
                    Send Reminder
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>No overdue bills</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
