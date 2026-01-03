'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Connections', href: '/dashboard/connections', icon: Cable },
  { name: 'Meters', href: '/dashboard/meters', icon: Gauge },
  { name: 'Readings', href: '/dashboard/readings', icon: Gauge },
  { name: 'Bills', href: '/dashboard/bills', icon: FileText },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Work Orders', href: '/dashboard/work-orders', icon: Wrench },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
];

const utilityTypes = [
  { name: 'Water', icon: Droplets, color: 'text-blue-500' },
  { name: 'Electricity', icon: Zap, color: 'text-yellow-500' },
  { name: 'Gas', icon: Flame, color: 'text-orange-500' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
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
            'p-1.5 rounded-lg hover:bg-gray-100 text-gray-500',
            isCollapsed && 'mx-auto mt-2'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', !isCollapsed && 'mr-3')} />
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
                  <Icon className={cn('h-5 w-5', utility.color)} />
                  <span className="text-xs text-gray-500 mt-1">{utility.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
