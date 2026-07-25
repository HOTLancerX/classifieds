"use client";

import { Icon } from "@iconify/react";
import type { FieldProps } from "@/hook";

export function Checkboxes({ name, label, value, onChange, options = [] }: FieldProps) {
    // Multiple selection support: parse comma-separated string into array
    const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

    const toggle = (val: string) => {
        const next = selected.includes(val)
            ? selected.filter((v) => v !== val)
            : [...selected, val];
        // Emit updated comma-separated list of multiple selected items
        onChange(next.join(","));
    };

    return (
        <div className="flex flex-col gap-2 bg-white border border-gray-100 rounded-xl p-3.5 shadow-2xs">
            <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                <Icon icon="solar:tag-bold" className="w-3.5 h-3.5 text-main" />
                {label}
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
                {options.map((opt) => {
                    const checked = selected.includes(opt.value);
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
                                type="checkbox"
                                name={name}
                                value={opt.value}
                                checked={checked}
                                onChange={() => toggle(opt.value)}
                                className="sr-only"
                            />
                            <Icon
                                icon={checked ? "solar:check-square-bold" : "solar:square-linear"}
                                className="w-3.5 h-3.5 shrink-0"
                            />
                            <span>{opt.label}</span>
                        </label>
                    );
                })}
            </div>
            {selected.length > 0 && (
                <div className="text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100/80">
                    Selected ({selected.length}): <span className="text-main font-bold">{selected.join(", ")}</span>
                </div>
            )}
        </div>
    );
}

export default Checkboxes;
