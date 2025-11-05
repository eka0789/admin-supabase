"use client";

import * as React from "react";

function cn(...classes: Array<string | undefined | null | false>) {
    return classes.filter(Boolean).join(" ");
}

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 w-full max-w-md relative"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({
    children,
    className,
}: { children: React.ReactNode; className?: string }) {
    return <div className={cn("mb-4", className)}>{children}</div>;
}

export function DialogTitle({
    children,
    className,
}: { children: React.ReactNode; className?: string }) {
    return (
        <h2
            className={cn(
                "text-lg font-semibold text-slate-800 dark:text-slate-100",
                className
            )}
        >
            {children}
        </h2>
    );
}

export function DialogContent({
    children,
    className,
}: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("space-y-4 text-slate-700 dark:text-slate-200", className)}>
            {children}
        </div>
    );
}

export function DialogFooter({
    children,
    className,
}: { children: React.ReactNode; className?: string }) {
    return <div className={cn("mt-6 flex justify-end gap-2", className)}>{children}</div>;
}
