import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'workOrder' | 'complaint' | 'asset' | 'disconnection' | 'reconnection';
}

const statusColors: Record<string, string> = {
  // Work Order statuses
  OPEN: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  
  // Complaint statuses
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  
  // Asset statuses
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-red-100 text-red-800',
  
  // Disconnection/Reconnection statuses
  PENDING: 'bg-yellow-100 text-yellow-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  EXECUTED: 'bg-green-100 text-green-800',
};

export function StatusBadge({ status, type = 'workOrder' }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
