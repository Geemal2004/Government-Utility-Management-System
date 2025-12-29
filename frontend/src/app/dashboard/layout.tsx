'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { Sidebar, Header } from '@/components/layouts';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64 pl-20 transition-all duration-300">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
