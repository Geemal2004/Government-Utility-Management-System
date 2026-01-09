'use client';

import { EmployeeRole, ROLE_COLORS, ROLE_LABELS } from '@/types/employee';

interface RoleBadgeProps {
    role: EmployeeRole;
    size?: 'sm' | 'md';
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
    const colors = ROLE_COLORS[role] || ROLE_COLORS.ADMINISTRATIVE_STAFF;
    const label = ROLE_LABELS[role] || role;

    const sizeClasses = size === 'sm'
        ? 'px-2 py-0.5 text-xs'
        : 'px-2.5 py-1 text-sm';

    return (
        <span
            className={`inline-flex items-center rounded-full font-medium border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
        >
            {label}
        </span>
    );
}

interface StatusBadgeProps {
    isActive: boolean;
    showDot?: boolean;
}

export function StatusBadge({ isActive, showDot = true }: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${isActive
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
        >
            {showDot && (
                <span
                    className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                />
            )}
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
}

interface AvatarProps {
    firstName: string;
    lastName: string;
    size?: 'sm' | 'md' | 'lg';
    photoUrl?: string | null;
}

export function Avatar({ firstName, lastName, size = 'md', photoUrl }: AvatarProps) {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={`${firstName} ${lastName}`}
                className={`${sizeClasses[size]} rounded-full object-cover`}
            />
        );
    }

    // Generate a consistent color based on initials
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-orange-500',
        'bg-teal-500',
        'bg-pink-500',
        'bg-indigo-500',
    ];
    const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;

    return (
        <div
            className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold`}
        >
            {initials}
        </div>
    );
}
