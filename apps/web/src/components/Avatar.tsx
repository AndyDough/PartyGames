import React from 'react';

export const AVATARS = [
    // 0: Diamond in Circle
    (className?: string) => (
        <svg viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="6" />
            <rect x="30" y="30" width="40" height="40" fill="white" transform="rotate(45 50 50)" />
            <circle cx="50" cy="50" r="8" fill="black" />
        </svg>
    ),
    // 1: Concentric Circles
    (className?: string) => (
        <svg viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="6" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="6" />
            <circle cx="50" cy="50" r="8" fill="white" />
        </svg>
    ),
    // 2: Square with Circle
    (className?: string) => (
        <svg viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="6" />
            <rect x="30" y="30" width="40" height="40" fill="white" />
            <circle cx="50" cy="50" r="10" fill="black" />
        </svg>
    ),
    // 3: Cross in Circle
    (className?: string) => (
        <svg viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="6" />
            <line x1="30" y1="30" x2="70" y2="70" stroke="white" strokeWidth="6" strokeLinecap="round" />
            <line x1="70" y1="30" x2="30" y2="70" stroke="white" strokeWidth="6" strokeLinecap="round" />
        </svg>
    ),
    // 4: Triangle in Circle
    (className?: string) => (
        <svg viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="6" />
            <path d="M50 25 L75 65 L25 65 Z" fill="white" />
        </svg>
    ),
    // 5: Solid with Inverse Dot
    (className?: string) => (
        <svg viewBox="0 0 100 100" className={className}>
            <circle cx="50" cy="50" r="48" fill="white" />
            <circle cx="50" cy="50" r="12" fill="black" />
        </svg>
    ),
];

export function Avatar({ index, className }: { index: number, className?: string }) {
    const render = AVATARS[index % AVATARS.length];
    return render(className);
}
