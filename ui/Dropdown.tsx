"use client";

import { Icon } from "@iconify/react";
import type { FieldProps } from "@/hook";

export function Dropdown({ name, label, value, onChange, options = [] }: FieldProps) {
    // Single selection only: take the first item if value was passed as a list
    const selectedValue = value ? value.split(",")[0].trim() : "";

    const handleSelect = (val: string) => {
        // Guarantee single selection
        onChange(val);
    };

    return (
        <div className="flex flex-col gap-2 bg-white border border-gray-100 rounded-xl p-3.5 shadow-2xs">
            <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                <Icon icon="solar:tag-bold" className="w-3.5 h-3.5 text-main" />
                {label}
            </span>
            <select
                name={name}
                value={selectedValue}
                onChange={(e) => handleSelect(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-main transition cursor-pointer"
            >
                <option value="">— Select {label} —</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {selectedValue && (
                <div className="text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100/80">
                    Selected: <span className="text-main font-bold">{selectedValue}</span>
                </div>
            )}
        </div>
    );
}

export default Dropdown;
