"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import type { FieldProps } from "@/hook";
import { xFetch } from "@/lib/express";
import Checkboxes from "./Checkboxes";
import Radio from "./Radio";
import Dropdown from "./Dropdown";

interface CatNode {
    _id: string;
    title: string;
    parentId: string | null;
    displayType?: string;
}

interface AttributeGroup {
    id: string;
    title: string;
    displayType?: string;
    options: { id: string; title: string }[];
}

interface SavedAttributeState {
    values: Record<string, string | string[]>;
}

export function ClassifiedAttributes({ name, label, value, onChange }: FieldProps) {
    const [groups, setGroups] = useState<AttributeGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    // Selected values per attribute group
    const [values, setValues] = useState<Record<string, string | string[]>>({});

    // Parse initial value from prop
    useEffect(() => {
        if (!value) return;
        try {
            const parsed: SavedAttributeState = JSON.parse(value);
            if (parsed && typeof parsed === "object" && parsed.values) {
                setValues(parsed.values);
            }
        } catch {
            /* ignore non-json string */
        }
    }, [value]);

    // Fetch attributes and their CatInfo configurations (displayType, linkedCategories)
    const fetchAttributes = useCallback(() => {
        setLoading(true);
        setError(false);

        const loadType = (typeKey: string) =>
            xFetch(`/cat?type=${encodeURIComponent(typeKey)}`, { cache: "no-store" })
                .then((r) => r.json())
                .then((data) => (data.cats ?? []) as any[]);

        loadType("directory-attribute")
            .then(async (catsData) => {
                let catsList = catsData;
                if (catsList.length === 0) {
                    catsList = await loadType("classifieds-attribute");
                }

                const rawCats: CatNode[] = catsList.map((c: any) => ({
                    _id: String(c._id),
                    title: c.title ?? "",
                    parentId: c.parentId ? String(c.parentId) : null,
                }));

                const parentNodes = rawCats.filter((c) => c.parentId === null);

                // Fetch detailed CatInfo for each parent category to retrieve configured displayType
                const parentDetails = await Promise.all(
                    parentNodes.map(async (p) => {
                        try {
                            const res = await xFetch(`/cat?id=${p._id}`, { cache: "no-store" });
                            const data = await res.json();
                            const infoList: { name: string; value: string }[] = data.info ?? [];
                            const displayItem = infoList.find((i) => i.name === "displayType");
                            const displayType = displayItem?.value || "checkbox";
                            return {
                                id: p._id,
                                title: p.title,
                                displayType,
                            };
                        } catch {
                            return {
                                id: p._id,
                                title: p.title,
                                displayType: "checkbox",
                            };
                        }
                    })
                );

                const result: AttributeGroup[] = parentDetails.map((parent) => ({
                    id: parent.id,
                    title: parent.title,
                    displayType: parent.displayType,
                    options: rawCats
                        .filter((c) => c.parentId === parent.id)
                        .map((c) => ({ id: c._id, title: c.title })),
                }));

                // Fallback if top-level flat attributes exist without parents
                if (result.length === 0 && rawCats.length > 0) {
                    result.push({
                        id: "general_attributes",
                        title: "Attributes",
                        displayType: "checkbox",
                        options: rawCats.map((c) => ({ id: c._id, title: c.title })),
                    });
                }

                setGroups(result);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchAttributes();
    }, [fetchAttributes]);

    const handleValueChange = (groupId: string, newVal: string) => {
        const nextValues = { ...values, [groupId]: newVal };
        setValues(nextValues);
        onChange(JSON.stringify({ values: nextValues }));
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-main" />
                Loading attribute information…
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-xs text-red-500 py-2">
                <span>Failed to load attribute information.</span>
                <button type="button" onClick={fetchAttributes} className="text-main hover:underline font-semibold">
                    Retry
                </button>
            </div>
        );
    }

    if (groups.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {groups.map((group) => {
                const currentVal = values[group.id];
                const valString = Array.isArray(currentVal) ? currentVal.join(",") : (currentVal || "");

                const fieldOptions = group.options.map((opt) => ({
                    label: opt.title,
                    value: opt.title,
                }));

                const format = group.displayType || "checkbox";

                if (format === "radio") {
                    return (
                        <Radio
                            key={group.id}
                            name={`${name}_${group.id}`}
                            label={group.title}
                            value={valString}
                            onChange={(val) => handleValueChange(group.id, val)}
                            options={fieldOptions}
                        />
                    );
                }

                if (format === "select") {
                    return (
                        <Dropdown
                            key={group.id}
                            name={`${name}_${group.id}`}
                            label={group.title}
                            value={valString}
                            onChange={(val) => handleValueChange(group.id, val)}
                            options={fieldOptions}
                        />
                    );
                }

                // Default: Checkboxes (Multiple selection)
                return (
                    <Checkboxes
                        key={group.id}
                        name={`${name}_${group.id}`}
                        label={group.title}
                        value={valString}
                        onChange={(val) => handleValueChange(group.id, val)}
                        options={fieldOptions}
                    />
                );
            })}
        </div>
    );
}

export default ClassifiedAttributes;
