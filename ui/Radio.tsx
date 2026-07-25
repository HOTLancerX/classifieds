"use client";

import { Icon } from "@iconify/react";
import type { FieldProps } from "@/hook";

export function Radio({ name, label, value, onChange, options = [] }: FieldProps) {
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
            <div className="flex flex-wrap gap-2 pt-1">
                {options.map((opt) => {
                    const checked = selectedValue === opt.value;
                    return (
                        <label
                            key={opt.value}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                                checked
                                    ? "bg-main text-white border-main shadow-2xs"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-main/50"
                            }`}
                        >
                            <input
                                type="radio"
                                name={name}
                                value={opt.value}
                                checked={checked}
                                onChange={() => handleSelect(opt.value)}
                                className="sr-only"
                            />
                            <Icon
                                icon={checked ? "solar:record-bold" : "solar:record-linear"}
                                className="w-3.5 h-3.5 shrink-0"
                            />
                            <span>{opt.label}</span>
                        </label>
                    );
                })}
            </div>
            {selectedValue && (
                <div className="text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100/80">
                    Selected: <span className="text-main font-bold">{selectedValue}</span>
                </div>
            )}
        </div>
    );
}

export default Radio;
