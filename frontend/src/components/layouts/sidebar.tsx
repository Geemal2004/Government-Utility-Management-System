"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Cable,
  Gauge,
  FileText,
  CreditCard,
  Wrench,
  Package,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Zap,
  Flame,
  Building2,
  CircleDollarSign,
  ClipboardList,
  Route,
  BarChart3,
  Settings,
  UserCog,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, EmployeeRole } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: EmployeeRole[]; // If undefined, available to all roles
}

// Navigation items with role-based access
const navigationItems: NavItem[] = [
  // Admin/Manager - Full access
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER'] },
  { name: "Employees", href: "/dashboard/employees", icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { name: "Departments", href: "/dashboard/departments", icon: Building2, roles: ['ADMIN', 'MANAGER'] },
  { name: "Payroll", href: "/dashboard/payroll", icon: CircleDollarSign, roles: ['ADMIN', 'MANAGER'] },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },

  // Cashier specific
  { name: "Dashboard", href: "/dashboard/cashier", icon: LayoutDashboard, roles: ['CASHIER'] },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard, roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { name: "Receipts", href: "/dashboard/receipts", icon: Receipt, roles: ['CASHIER'] },

  // Meter Reader specific
  { name: "Dashboard", href: "/dashboard/meter-reader", icon: LayoutDashboard, roles: ['METER_READER'] },
  { name: "My Routes", href: "/dashboard/routes", icon: Route, roles: ['METER_READER'] },
  { name: "Readings", href: "/dashboard/readings", icon: Gauge, roles: ['ADMIN', 'MANAGER', 'METER_READER'] },

  // Field Officer specific
  { name: "Dashboard", href: "/dashboard/field-officer", icon: LayoutDashboard, roles: ['FIELD_OFFICER'] },
  { name: "Work Orders", href: "/dashboard/work-orders", icon: Wrench, roles: ['ADMIN', 'MANAGER', 'FIELD_OFFICER'] },
  { name: "Inspections", href: "/dashboard/inspections", icon: ClipboardList, roles: ['FIELD_OFFICER'] },

  // Administrative Staff specific
  { name: "Dashboard", href: "/dashboard/admin-staff", icon: LayoutDashboard, roles: ['ADMINISTRATIVE_STAFF'] },
  { name: "Customers", href: "/dashboard/customers", icon: Users, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE_STAFF'] },
  { name: "Connections", href: "/dashboard/connections", icon: Cable, roles: ['ADMIN', 'MANAGER', 'ADMINISTRATIVE_STAFF'] },

  // Shared resources
  { name: "Meters", href: "/dashboard/meters", icon: Gauge, roles: ['ADMIN', 'MANAGER', 'METER_READER', 'FIELD_OFFICER'] },
  { name: "Bills", href: "/dashboard/bills", icon: FileText, roles: ['ADMIN', 'MANAGER', 'CASHIER', 'ADMINISTRATIVE_STAFF'] },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package, roles: ['ADMIN', 'MANAGER', 'FIELD_OFFICER'] },

  // My payslips - available to all employees
  { name: "My Payslips", href: "/dashboard/me/payslips", icon: Receipt },

  // Settings - Admin only
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ['ADMIN'] },
];

const utilityTypes = [
  { name: "Water", icon: Droplets, color: "text-blue-500" },
  { name: "Electricity", icon: Zap, color: "text-yellow-500" },
  { name: "Gas", icon: Flame, color: "text-orange-500" },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, hasRole } = useAuth();

  // Filter navigation based on user role
  const filteredNavigation = navigationItems.filter((item) => {
    if (!item.roles) return true; // Available to all
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  // Remove duplicate dashboard entries (keep only one per path)
  const uniqueNavigation = filteredNavigation.reduce((acc, item) => {
    if (!acc.some(existing => existing.href === item.href)) {
      acc.push(item);
    }
    return acc;
  }, [] as NavItem[]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">GUMS</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
            <Zap className="h-5 w-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-gray-100 text-gray-500",
            isCollapsed && "mx-auto mt-2"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
        {uniqueNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                className={cn("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Utility Types Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Utilities
          </p>
          <div className="flex justify-around">
            {utilityTypes.map((utility) => {
              const Icon = utility.icon;
              return (
                <div
                  key={utility.name}
                  className="flex flex-col items-center text-center"
                  title={utility.name}
                >
                  <Icon className={cn("h-5 w-5", utility.color)} />
                  <span className="text-xs text-gray-500 mt-1">
                    {utility.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
