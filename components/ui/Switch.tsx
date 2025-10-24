import React from "react";

export default function Switch({ checked = false, onChange }: { checked?: boolean; onChange?: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange && onChange(!checked)}
            className={`w-12 h-6 rounded-full p-1 ${checked ? "bg-green-500" : "bg-gray-300"}`}
            aria-pressed={checked}
        >
            <span className={`block w-4 h-4 bg-white rounded-full transform ${checked ? "translate-x-6" : "translate-x-0"}`} />
        </button>
    );
}
