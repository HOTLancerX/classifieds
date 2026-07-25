"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

export interface ClassifiedsBoxProps {
    item?: any;
    data?: any;
    itemUrl?: string;
    postUrl?: string;
    productUrl?: string;
    ratingStats?: {
        averageRating: number;
        totalCount: number;
    };
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export default function ClassifiedsBox3(props: ClassifiedsBoxProps) {
    const item = props.item || props.data || {};
    const info = item.info || {};
    const targetUrl = props.itemUrl || props.postUrl || props.productUrl || (item.slug ? `/${item.slug}` : "#");

    const images = parseJson<string[]>(info.images, []);
    const cover = images[0] || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop";
    const address = parseJson<Record<string, string>>(info.address, {});
    const contact = parseJson<Record<string, string>>(info.contact, {});

    const avgRating = props.ratingStats?.averageRating || 0;
    const totalReviews = props.ratingStats?.totalCount || 0;

    const locationText = info.locationText || "";
    const rawAddressParts = [
        address.address,
        locationText,
        address.cityName || address.city,
        address.regionName || address.region,
        address.countryName || address.country,
    ].filter(Boolean);
    const addressParts = Array.from(new Set(rawAddressParts));
    const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : (info.fullAddress || info.location || "");

    // Extract specific Condition attribute (by slug or saved info value)
    const rawAttr = info.directory_attributes || info.classifieds_attributes || info.attributes;
    let conditionValue = info.condition || "";
    if (!conditionValue && rawAttr) {
        try {
            const parsed = typeof rawAttr === "object" ? rawAttr : JSON.parse(rawAttr);
            const vals = parsed?.values || parsed || {};
            if (vals.condition) {
                conditionValue = Array.isArray(vals.condition) ? vals.condition.join(", ") : String(vals.condition);
            } else {
                // Read first parent attribute value (e.g. Condition -> Used / New)
                const firstVal = Object.values(vals)[0];
                if (firstVal) {
                    conditionValue = Array.isArray(firstVal) ? firstVal.join(", ") : String(firstVal);
                }
            }
        } catch {
            /* ignore json error */
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group h-full">
            {/* Cover Image */}
            <div className="relative aspect-16/10 w-full overflow-hidden bg-gray-100">
                <img
                    src={cover}
                    alt={item.title || "Listing Image"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Rating Score & Review Count Badge on Image */}
                {totalReviews > 0 ? (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/95 text-gray-900 backdrop-blur-xs shadow-xs border border-amber-200/80 flex items-center gap-1">
                        <Icon icon="solar:star-bold" className="w-3 h-3 text-amber-400" />
                        <span>{avgRating.toFixed(1)}</span>
                        <span className="text-gray-400 font-semibold">({totalReviews})</span>
                    </span>
                ) : (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/80 text-gray-500 backdrop-blur-xs shadow-xs border border-gray-100 flex items-center gap-1">
                        <Icon icon="solar:star-linear" className="w-3 h-3 text-gray-400" />
                        0.0
                    </span>
                )}
                {conditionValue && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-emerald-600 backdrop-blur-xs shadow-xs border border-emerald-100 flex items-center gap-1">
                        {conditionValue}
                    </span>
                )}
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold text-gray-900 group-hover:text-main transition truncate flex-1">
                            <Link href={targetUrl}>{item.title || "Untitled"}</Link>
                        </h3>
                    </div>

                    {/* Rating & Review Count Line */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <div className="flex items-center gap-0.5 text-amber-400 font-bold">
                            <Icon icon="solar:star-bold" className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-extrabold text-gray-900">
                                {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
                            </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-semibold">
                            ({totalReviews} review{totalReviews === 1 ? "" : "s"})
                        </span>
                    </div>

                    {info.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {info.description.replace(/<[^>]*>?/gm, "")}
                        </p>
                    )}
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                    {fullAddress && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                            <Icon icon="solar:map-point-bold" className="w-3.5 h-3.5 text-main shrink-0" />
                            <span className="truncate">{fullAddress}</span>
                        </div>
                    )}

                    {contact.name && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
                            <Icon icon="solar:user-bold" className="w-3.5 h-3.5 text-main shrink-0" />
                            <span className="truncate">
                                {contact.position ? `${contact.position}: ` : ""}
                                {contact.name}
                            </span>
                        </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                        <Link
                            href={targetUrl}
                            className="text-xs font-bold text-main hover:underline transition flex items-center gap-1"
                        >
                            View Listing Details
                            <Icon icon="solar:alt-arrow-right-bold" className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
