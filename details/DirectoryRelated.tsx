"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { getHooks } from "@/hook";
import { useActivePlugins } from "@/hook/useActivePlugins";
import ClassifiedsBox3 from "../box/Box-3";

export interface DirectoryRelatedProps {
    categoryId?: string;
    currentId: string;
    directoryPrefix?: string;
    permalinkMap?: Record<string, string>;
    categoryUrl?: string;
}

export default function DirectoryRelated({
    categoryId,
    currentId,
    directoryPrefix = "directory",
    permalinkMap = {},
    categoryUrl,
}: DirectoryRelatedProps) {
    const activePlugins = useActivePlugins();
    const [ActiveBoxComponent, setActiveBoxComponent] = useState<any>(null);
    const [relatedItems, setRelatedItems] = useState<any[]>([]);
    const [relatedRatingsMap, setRelatedRatingsMap] = useState<Record<string, { averageRating: number; totalCount: number }>>({});
    const [loading, setLoading] = useState(true);

    // Resolve active box component from template system
    useEffect(() => {
        if (activePlugins === null) return;
        const boxType = "directory-box";
        const boxes = getHooks("root.pages").filter(
            (p) => p.type === boxType && p.slug === "dynamic"
        );
        let match = null;
        const activeBoxSetting = (permalinkMap as any)?.activeBoxTemplates?.[boxType];
        if (activeBoxSetting) {
            match = boxes.find(
                (b) => b.label === activeBoxSetting.label && b.pluginNx === activeBoxSetting.pluginNx
            )?.component ?? null;
        }
        if (!match) {
            match = (boxes.find((b) => b.active === true) ?? boxes[0])?.component ?? null;
        }
        setActiveBoxComponent(() => match);
    }, [activePlugins, permalinkMap]);

    // Fetch related directory posts in the same category ratio (limit to 10 items)
    useEffect(() => {
        if (!currentId) return;
        setLoading(true);

        const catQuery = categoryId ? `&category=${encodeURIComponent(categoryId)}` : "";
        fetch(`/api/admin-posts?type=directory${catQuery}&limit=20`)
            .then((r) => r.json())
            .then((res) => {
                const list = res.posts || res.data || res.items || (Array.isArray(res) ? res : []);
                const filtered = list.filter((p: any) => (p._id || p.id) !== currentId).slice(0, 10);
                setRelatedItems(filtered);
            })
            .catch((e) => console.error("Failed to load related directory items:", e))
            .finally(() => setLoading(false));

        // Fetch ratings map for badges
        fetch("/api/comments?targetType=directory&statsOnly=true")
            .then((r) => r.json())
            .then((res) => {
                if (res.success && res.stats) {
                    setRelatedRatingsMap(res.stats);
                }
            })
            .catch(() => { });
    }, [currentId, categoryId]);

    if (!loading && relatedItems.length === 0) {
        return null;
    }

    const BoxComp = ActiveBoxComponent || ClassifiedsBox3;

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                        <Icon icon="solar:widget-add-bold" className="w-5 h-5 text-indigo-600" />
                        Related Directory Listings & Products
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Discover 10 related items in this category
                    </p>
                </div>

                {categoryUrl && (
                    <Link
                        href={categoryUrl}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
                    >
                        View Category
                        <Icon icon="solar:alt-arrow-right-bold" className="w-3.5 h-3.5" />
                    </Link>
                )}
            </div>

            {/* Grid Layout: 5 items per line (10 items total) */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {relatedItems.map((item) => {
                        const itemUrl = directoryPrefix ? `/${directoryPrefix}/${item.slug}` : `/${item.slug}`;
                        const itemId = item._id || item.id;

                        return (
                            <div key={itemId} className="h-full">
                                <BoxComp
                                    item={item}
                                    data={item}
                                    itemUrl={itemUrl}
                                    productUrl={itemUrl}
                                    postUrl={itemUrl}
                                    ratingStats={relatedRatingsMap[itemId]}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
