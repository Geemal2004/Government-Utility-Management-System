"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar, Header } from "@/components/layouts";
import { ToastProvider } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";

// Role-specific dashboard paths
const ROLE_DASHBOARDS: Record<string, string> = {
  ADMIN: '/dashboard',
  MANAGER: '/dashboard',
  CASHIER: '/dashboard/cashier',
  METER_READER: '/dashboard/meter-reader',
  FIELD_OFFICER: '/dashboard/field-officer',
  ADMINISTRATIVE_STAFF: '/dashboard/admin-staff',
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Redirect to role-specific dashboard if on generic /dashboard
    // and user has a role that needs a specific dashboard
    if (user && pathname === '/dashboard') {
      const roleDashboard = ROLE_DASHBOARDS[user.role];
      if (roleDashboard && roleDashboard !== '/dashboard') {
        router.replace(roleDashboard);
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 pl-20 transition-all duration-300">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <DashboardContent>{children}</DashboardContent>
    </ToastProvider>
  );
}
