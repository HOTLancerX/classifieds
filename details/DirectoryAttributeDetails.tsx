"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { xFetch } from "@/lib/express";

interface DirectoryAttributeDetailsProps {
    attributesData?: string | Record<string, any>;
    info?: Record<string, string>;
}

interface AttributeGroupDisplay {
    id: string;
    title: string;
    values: string[];
}

export function DirectoryAttributeDetails({ attributesData, info }: DirectoryAttributeDetailsProps) {
    const [groups, setGroups] = useState<AttributeGroupDisplay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Resolve raw attributes string from props or info object
        const rawAttr =
            attributesData ||
            info?.directory_attributes ||
            info?.classifieds_attributes ||
            info?.attributes;

        if (!rawAttr) {
            setLoading(false);
            return;
        }

        let parsedValues: Record<string, string | string[]> = {};
        try {
            if (typeof rawAttr === "object") {
                parsedValues = rawAttr.values || rawAttr;
            } else {
                const parsed = JSON.parse(rawAttr);
                parsedValues = parsed?.values || parsed || {};
            }
        } catch {
            setLoading(false);
            return;
        }

        if (!parsedValues || Object.keys(parsedValues).length === 0) {
            setLoading(false);
            return;
        }

        // Fetch parent categories (directory-attribute / classifieds-attribute) to match parent IDs to titles
        const loadType = (typeKey: string) =>
            xFetch(`/cat?type=${encodeURIComponent(typeKey)}`, { cache: "no-store" })
                .then((r) => r.json())
                .then((d) => (d.cats ?? []) as any[]);

        loadType("directory-attribute")
            .then(async (catsData) => {
                let catsList = catsData;
                if (catsList.length === 0) {
                    catsList = await loadType("classifieds-attribute");
                }

                // Parent nodes
                const parents = catsList.filter((c: any) => c.parentId === null);
                const displayList: AttributeGroupDisplay[] = [];

                for (const parent of parents) {
                    const pid = String(parent._id);
                    const val = parsedValues[pid];
                    if (!val) continue;

                    let valArray: string[] = [];
                    if (Array.isArray(val)) {
                        valArray = val.map(String).filter(Boolean);
                    } else if (typeof val === "string") {
                        valArray = val.split(",").map((s) => s.trim()).filter(Boolean);
                    }

                    if (valArray.length > 0) {
                        displayList.push({
                            id: pid,
                            title: parent.title || "Attribute",
                            values: valArray,
                        });
                    }
                }

                // Fallback for unparented attributes if any
                if (displayList.length === 0) {
                    for (const [k, v] of Object.entries(parsedValues)) {
                        if (!v) continue;
                        const arr = Array.isArray(v)
                            ? v
                            : String(v).split(",").map((s) => s.trim()).filter(Boolean);
                        if (arr.length > 0) {
                            displayList.push({
                                id: k,
                                title: "Attributes",
                                values: arr,
                            });
                        }
                    }
                }

                setGroups(displayList);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [attributesData, info]);

    if (loading || groups.length === 0) {
        return null;
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Icon icon="solar:tag-bold" className="w-5 h-5 text-main" />
                Directory Attributes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-2"
                    >
                        <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">
                            {group.title}
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {group.values.map((val, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-main/10 text-main text-xs font-bold border border-main/20"
                                >
                                    <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 shrink-0" />
                                    {val}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DirectoryAttributeDetails;
