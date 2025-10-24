import React from "react";

export default function Button({ children, onClick, className = "", disabled = false, ...rest }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${className}`}
            {...rest}
        >
            {children}
        </button>
    );
}
