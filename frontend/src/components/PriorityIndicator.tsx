import React from 'react';

interface PriorityIndicatorProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  showLabel?: boolean;
}

const priorityConfig = {
  LOW: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '●',
  },
  MEDIUM: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: '●●',
  },
  HIGH: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '●●●',
  },
  CRITICAL: {
    color: 'text-red-700',
    bgColor: 'bg-red-200',
    icon: '⚠',
  },
};

export function PriorityIndicator({ priority, showLabel = true }: PriorityIndicatorProps) {
  const config = priorityConfig[priority] || priorityConfig.LOW;
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}
      title={priority}
    >
      <span className="mr-1">{config.icon}</span>
      {showLabel && priority}
    </span>
  );
}
