"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import ClassifiedsBox3 from "../box/Box-3";

export interface DirectoryItem {
    _id: string;
    title: string;
    slug: string;
    category?: string;
    categoryTitle?: string;
    createdAt?: string;
    info: Record<string, string>;
}

export interface DirectoryGridClientProps {
    categoryTitle: string;
    categoryDescription?: string;
    items: DirectoryItem[];
    allCategories: { _id: string; title: string; slug: string }[];
    locationNodes: { id: string; title: string; parentId: string | null }[];
    directoryPrefix: string;
    catPrefix: string;
    showHeroBanner?: boolean;
    BoxComponent?: React.ComponentType<any> | null;
}

export const POSITIONS = [
    "Owner",
    "Director",
    "Managing Director",
    "CEO",
    "Founder",
    "Operations Manager",
    "General Manager",
    "Marketing Manager",
    "Sales Manager",
    "Accounts Manager",
    "Office Manager",
    "Administrator",
];

function parseJson<T>(raw: string | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export default function DirectoryGridClient({
    categoryTitle,
    categoryDescription,
    items,
    allCategories = [],
    locationNodes = [],
    directoryPrefix,
    catPrefix,
    showHeroBanner = true,
    BoxComponent: ServerBoxComponent,
}: DirectoryGridClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Mobile Filter Drawer Toggle State
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Read initial filters from searchParams
    const initialQuery = searchParams.get("q") || "";
    const initialCountry = searchParams.get("country") || "";
    const initialRegion = searchParams.get("region") || "";
    const initialCity = searchParams.get("city") || "";
    const initialCat = searchParams.get("cat") || "";
    const initialPosition = searchParams.get("position") || "";
    const initialOpen = searchParams.get("open") || "";

    const [q, setQ] = useState(initialQuery);
    const [country, setCountry] = useState(initialCountry);
    const [region, setRegion] = useState(initialRegion);
    const [city, setCity] = useState(initialCity);
    const [cat, setCat] = useState(initialCat);
    const [position, setPosition] = useState(initialPosition);
    const [openFilter, setOpenFilter] = useState(initialOpen);

    // Review ratings map for cards
    const [ratingsMap, setRatingsMap] = useState<Record<string, { averageRating: number; totalCount: number }>>({});

    useEffect(() => {
        fetch("/api/comments?targetType=directory&statsOnly=true")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.stats) {
                    setRatingsMap(data.stats);
                }
            })
            .catch((e) => console.error("Failed to load review stats:", e));
    }, []);

    // Filter locations by hierarchy
    const countries = locationNodes.filter((n) => n.parentId === null);
    const selectedCountryNode = locationNodes.find((n) => n.id === country || n.title === country);
    const regions = selectedCountryNode
        ? locationNodes.filter((n) => n.parentId === selectedCountryNode.id)
        : [];
    const selectedRegionNode = locationNodes.find((n) => n.id === region || n.title === region);
    const cities = selectedRegionNode
        ? locationNodes.filter((n) => n.parentId === selectedRegionNode.id)
        : [];

    const applyFilters = (overrides: Record<string, string> = {}) => {
        const nextQ = overrides.q !== undefined ? overrides.q : q;
        const nextCountry = overrides.country !== undefined ? overrides.country : country;
        const nextRegion = overrides.region !== undefined ? overrides.region : region;
        const nextCity = overrides.city !== undefined ? overrides.city : city;
        const nextCat = overrides.cat !== undefined ? overrides.cat : cat;
        const nextPos = overrides.position !== undefined ? overrides.position : position;
        const nextOpen = overrides.open !== undefined ? overrides.open : openFilter;

        const params = new URLSearchParams();
        if (nextQ) params.set("q", nextQ);
        if (nextCountry) params.set("country", nextCountry);
        if (nextRegion) params.set("region", nextRegion);
        if (nextCity) params.set("city", nextCity);
        if (nextCat) params.set("cat", nextCat);
        if (nextPos) params.set("position", nextPos);
        if (nextOpen) params.set("open", nextOpen);

        const queryString = params.toString();
        const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

        startTransition(() => {
            router.push(targetUrl);
        });
    };

    const handleClearFilters = () => {
        setQ("");
        setCountry("");
        setRegion("");
        setCity("");
        setCat("");
        setPosition("");
        setOpenFilter("");
        startTransition(() => {
            router.push(pathname);
        });
    };

    const hasActiveFilters = Boolean(q || country || region || city || cat || position || openFilter);

    // Client-side filtering logic on provided items
    const filteredItems = items.filter((item) => {
        const address = parseJson<Record<string, string>>(item.info?.address, {});
        const contact = parseJson<Record<string, string>>(item.info?.contact, {});
        const opening = parseJson<Record<string, any>>(item.info?.openingTimes, {});

        // Keyword
        if (q) {
            const queryLower = q.toLowerCase();
            const titleMatch = item.title.toLowerCase().includes(queryLower);
            const descMatch = (item.info?.description || "").toLowerCase().includes(queryLower);
            const addrMatch = (address.address || "").toLowerCase().includes(queryLower);
            if (!titleMatch && !descMatch && !addrMatch) return false;
        }

        // Location filters
        if (country) {
            let match =
                address.countryId === country ||
                address.countryName?.toLowerCase() === country.toLowerCase();
            if (!match && item.info?.country) {
                try {
                    const parsed = JSON.parse(item.info.country);
                    if (parsed?.id === country || (parsed?.path && parsed.path.includes(country))) match = true;
                } catch {
                    if (item.info.country === country) match = true;
                }
            }
            if (!match) return false;
        }
        if (region) {
            let match =
                address.regionId === region ||
                address.regionName?.toLowerCase() === region.toLowerCase();
            if (!match && item.info?.country) {
                try {
                    const parsed = JSON.parse(item.info.country);
                    if (parsed?.id === region || (parsed?.path && parsed.path.includes(region))) match = true;
                } catch {
                    if (item.info.country === region) match = true;
                }
            }
            if (!match) return false;
        }
        if (city) {
            let match =
                address.cityId === city ||
                address.cityName?.toLowerCase() === city.toLowerCase();
            if (!match && item.info?.country) {
                try {
                    const parsed = JSON.parse(item.info.country);
                    if (parsed?.id === city || (parsed?.path && parsed.path.includes(city))) match = true;
                } catch {
                    if (item.info.country === city) match = true;
                }
            }
            if (!match) return false;
        }

        // Category filter
        if (cat) {
            const matchModelCat = item.category === cat;
            let matchInfoCat = false;
            if (item.info?.category) {
                try {
                    const parsed = JSON.parse(item.info.category);
                    if (parsed?.id === cat || (parsed?.path && parsed.path.includes(cat))) {
                        matchInfoCat = true;
                    }
                } catch {
                    if (item.info.category === cat) matchInfoCat = true;
                }
            }
            if (!matchModelCat && !matchInfoCat) return false;
        }

        // Position filter
        if (position) {
            if (contact.position?.toLowerCase() !== position.toLowerCase()) return false;
        }

        // Opening hours filter
        if (openFilter === "24h") {
            const has24h = Object.values(opening).some((d: any) => d.status === "open_24h");
            if (!has24h) return false;
        }

        return true;
    });

    const activeFilterCount = [q, country, region, city, cat, position, openFilter].filter(Boolean).length;
    const catMap = new Map(allCategories.map((c) => [c._id, c.title]));
    const ActiveBox = ServerBoxComponent || ClassifiedsBox3;

    return (
        <div className="container py-8 space-y-8 font-sans">
            {/* Header / Banner (Controlled via showHeroBanner) */}
            {showHeroBanner && (
                <div className="bg-linear-to-r from-main via-main/50 to-main/80 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 inline-block uppercase tracking-wider">
                            Directory Search
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            {categoryTitle || "Business Directory"}
                        </h1>
                        {categoryDescription && (
                            <p className="text-indigo-200/80 text-sm max-w-2xl leading-relaxed">
                                {categoryDescription}
                            </p>
                        )}
                        <p className="text-xs text-indigo-300 pt-2 font-medium">
                            Showing <strong className="text-white">{filteredItems.length}</strong> listings
                        </p>
                    </div>
                </div>
            )}

            {/* Mobile Filter Drawer Button (Visible on Mobile lg:hidden) */}
            <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Icon icon="solar:filter-bold" className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-900 block">Filter Listings</span>
                        <span className="text-[11px] text-gray-500 font-medium">
                            {filteredItems.length} results {activeFilterCount > 0 && `• ${activeFilterCount} active`}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                    <span>{isMobileFilterOpen ? "Hide Filters" : "Show Filters"}</span>
                    <Icon icon={isMobileFilterOpen ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"} />
                </button>
            </div>

            {/* Main Grid Layout: Filters Sidebar (4 cols) + Cards Grid (8 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Filters Sidebar */}
                <div className={`lg:col-span-3 space-y-6 ${isMobileFilterOpen ? "block" : "hidden lg:block"}`}>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <Icon icon="solar:filter-bold" className="w-4 h-4 text-indigo-500" />
                                Filter Listings
                            </h3>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="text-xs text-red-500 hover:underline font-semibold"
                                >
                                    Reset All
                                </button>
                            )}
                        </div>

                        {/* Keyword Search */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Icon icon="solar:magnifer-bold" className="w-3.5 h-3.5 text-indigo-500" />
                                Keyword Search
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && applyFilters({ q })}
                                    placeholder="Business name or service..."
                                    className="w-full rounded-xl border border-gray-200 pl-3.5 pr-9 py-2.5 text-xs outline-none focus:border-indigo-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => applyFilters({ q })}
                                    className="absolute right-2.5 top-2.5 text-indigo-600 hover:text-indigo-800"
                                >
                                    <Icon icon="solar:magnifer-bold" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Category List Filter (Replacing Select Dropdown) */}
                        {allCategories.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Icon icon="solar:folder-with-files-bold" className="w-4 h-4 text-indigo-500" />
                                        Category
                                    </span>
                                    {cat && (
                                        <button
                                            type="button"
                                            onClick={() => { setCat(""); applyFilters({ cat: "" }); }}
                                            className="text-[10px] text-red-500 font-semibold hover:underline"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1 max-h-52 overflow-y-auto pr-1 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => { setCat(""); applyFilters({ cat: "" }); }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                                            !cat ? "bg-indigo-600 text-white font-bold shadow-xs" : "bg-gray-50 hover:bg-indigo-50/60 text-gray-700"
                                        }`}
                                    >
                                        <span>All Categories</span>
                                        {!cat && <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                                    </button>
                                    {allCategories.map((c) => {
                                        const isSelected = cat === c._id;
                                        return (
                                            <button
                                                key={c._id}
                                                type="button"
                                                onClick={() => { setCat(c._id); applyFilters({ cat: c._id }); }}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                                                    isSelected ? "bg-indigo-600 text-white font-bold shadow-xs" : "bg-gray-50 hover:bg-indigo-50/60 text-gray-700"
                                                }`}
                                            >
                                                <span className="truncate">{c.title}</span>
                                                {isSelected && <Icon icon="solar:check-circle-bold" className="w-4 h-4 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Location Hierarchy List Filter (Replacing Select Dropdowns) */}
                        {countries.length > 0 && (
                            <div className="space-y-3 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Icon icon="solar:map-point-bold" className="w-3.5 h-3.5 text-indigo-500" />
                                        Location Filter
                                    </span>
                                    {(country || region || city) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCountry(""); setRegion(""); setCity("");
                                                applyFilters({ country: "", region: "", city: "" });
                                            }}
                                            className="text-[10px] text-red-500 font-semibold hover:underline"
                                        >
                                            Reset Location
                                        </button>
                                    )}
                                </div>

                                {/* Country Pills */}
                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-gray-500 block">Country</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCountry(""); setRegion(""); setCity("");
                                                applyFilters({ country: "", region: "", city: "" });
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                                !country ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            All
                                        </button>
                                        {countries.map((c) => {
                                            const isSelected = country === c.id || country === c.title;
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setCountry(c.id); setRegion(""); setCity("");
                                                        applyFilters({ country: c.id, region: "", city: "" });
                                                    }}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                                        isSelected ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    {c.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Region Pills */}
                                {country && regions.length > 0 && (
                                    <div className="space-y-1 pt-2 border-t border-gray-200/60 animate-fadeIn">
                                        <span className="text-[11px] font-semibold text-gray-500 block">Region / State</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRegion(""); setCity("");
                                                    applyFilters({ region: "", city: "" });
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                                    !region ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                                }`}
                                            >
                                                All Regions
                                            </button>
                                            {regions.map((r) => {
                                                const isSelected = region === r.id || region === r.title;
                                                return (
                                                    <button
                                                        key={r.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setRegion(r.id); setCity("");
                                                            applyFilters({ region: r.id, city: "" });
                                                        }}
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                                            isSelected ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                                        }`}
                                                    >
                                                        {r.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* City Pills */}
                                {region && cities.length > 0 && (
                                    <div className="space-y-1 pt-2 border-t border-gray-200/60 animate-fadeIn">
                                        <span className="text-[11px] font-semibold text-gray-500 block">Town / City</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => { setCity(""); applyFilters({ city: "" }); }}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                                    !city ? "bg-sky-600 text-white shadow-xs" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                                }`}
                                            >
                                                All Cities
                                            </button>
                                            {cities.map((ct) => {
                                                const isSelected = city === ct.id || city === ct.title;
                                                return (
                                                    <button
                                                        key={ct.id}
                                                        type="button"
                                                        onClick={() => { setCity(ct.id); applyFilters({ city: ct.id }); }}
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                                            isSelected ? "bg-sky-600 text-white shadow-xs" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                                        }`}
                                                    >
                                                        {ct.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Contact Position Chips Filter (Replacing Select Dropdown) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Icon icon="solar:user-speak-bold" className="w-4 h-4 text-indigo-500" />
                                    Contact Position
                                </span>
                                {position && (
                                    <button
                                        type="button"
                                        onClick={() => { setPosition(""); applyFilters({ position: "" }); }}
                                        className="text-[10px] text-red-500 font-semibold hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                                <button
                                    type="button"
                                    onClick={() => { setPosition(""); applyFilters({ position: "" }); }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                        !position ? "bg-indigo-600 text-white shadow-xs" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                                    }`}
                                >
                                    All
                                </button>
                                {POSITIONS.map((pos) => {
                                    const isSelected = position.toLowerCase() === pos.toLowerCase();
                                    return (
                                        <button
                                            key={pos}
                                            type="button"
                                            onClick={() => { setPosition(pos); applyFilters({ position: pos }); }}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                                isSelected ? "bg-indigo-600 text-white shadow-xs" : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            {pos}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Operating Hours Filter (Replacing Select Dropdown) */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Icon icon="solar:clock-circle-bold" className="w-4 h-4 text-indigo-500" />
                                Operating Hours
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setOpenFilter(""); applyFilters({ open: "" }); }}
                                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition text-center border ${
                                        !openFilter ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                    }`}
                                >
                                    Any Hours
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setOpenFilter("24h"); applyFilters({ open: "24h" }); }}
                                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition text-center border ${
                                        openFilter === "24h" ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                    }`}
                                >
                                    Open 24/7
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Directory Cards Grid */}
                <div className="lg:col-span-9 space-y-6">
                    {isPending ? (
                        <div className="flex items-center justify-center py-24 text-gray-400">
                            <Icon icon="svg-spinners:ring-resize" width={32} />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-xs">
                            <Icon icon="solar:magnifer-bug-bold" className="w-16 h-16 text-indigo-300 mx-auto" />
                            <h3 className="text-lg font-bold text-gray-800">No Listings Found</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                No business listings matched your search criteria. Try resetting your filters to view more directory results.
                            </p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
                            {filteredItems.map((item) => {
                                const itemUrl = directoryPrefix ? `/${directoryPrefix}/${item.slug}` : `/${item.slug}`;

                                const resolvedCatTitle = (item as any).categoryTitle
                                    || catMap.get(item.category || "")
                                    || (item.info?.categoryName ?? "");

                                const enrichedItem = {
                                    ...item,
                                    categoryTitle: resolvedCatTitle,
                                };

                                return (
                                    <ActiveBox
                                        key={item._id}
                                        item={enrichedItem}
                                        data={enrichedItem}
                                        itemUrl={itemUrl}
                                        productUrl={itemUrl}
                                        ratingStats={ratingsMap[item._id]}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
