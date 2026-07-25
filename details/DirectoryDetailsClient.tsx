"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useUser } from "@/context/Provider";
import { xFetch } from "@/lib/express";
import DirectoryReviews from "./DirectoryReviews";
import DirectoryRelated from "./DirectoryRelated";
import DirectoryAttributeDetails from "./DirectoryAttributeDetails";

export interface DirectoryDetailsProps {
    data: {
        id: string;
        title: string;
        slug: string;
        category?: string;
        userId?: string;
        createdAt?: string;
        info?: Record<string, string>;
    };
    categoryLinks?: { title: string; url: string }[];
    locationLinks?: { title: string; url: string }[];
    allImages?: string[];
    description?: string;
    htmlDescription?: string;
    addressData?: {
        address?: string;
        countryName?: string;
        regionName?: string;
        cityName?: string;
        zipCode?: string;
    };
    contactData?: {
        position?: string;
        name?: string;
        mobile?: string;
        phone?: string;
        website?: string;
        email?: string;
    };
    socialData?: { platform: string; url: string }[];
    openingTimesData?: Record<string, { status: "custom" | "closed" | "open_24h"; openTime?: string; closeTime?: string }>;
    menuData?: any;
    videosData?: any;
    qnaData?: any;
    permalinkMap?: Record<string, string>;
    ownerUserId?: string;
}

const SOCIAL_ICONS: Record<string, string> = {
    facebook: "logos:facebook",
    instagram: "skill-icons:instagram",
    "twitter / x": "ri:twitter-x-fill",
    twitter: "ri:twitter-x-fill",
    linkedin: "logos:linkedin-icon",
    youtube: "logos:youtube-icon",
    tiktok: "logos:tiktok-icon",
    whatsapp: "logos:whatsapp-icon",
    telegram: "logos:telegram",
    website: "solar:globus-bold",
};

function getYouTubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
        ? `https://www.youtube.com/embed/${match[2]}`
        : null;
}

export default function DirectoryDetailsClient({
    data,
    categoryLinks = [],
    locationLinks = [],
    allImages = [],
    description = "",
    htmlDescription = "",
    addressData = {},
    contactData = {},
    socialData = [],
    openingTimesData = {},
    menuData = null,
    videosData = null,
    qnaData = null,
    permalinkMap = {},
    ownerUserId = "",
}: DirectoryDetailsProps) {
    const router = useRouter();
    const { user } = useUser();
    const isLogged = Boolean(user);

    const currentUserId = user?._id || (user as any)?.id;
    const targetUserId = ownerUserId || data.userId || data.info?.userId || "";
    const isOwnPost = Boolean(
        isLogged && currentUserId && targetUserId && String(currentUserId) === String(targetUserId)
    );

    const [selectedImage, setSelectedImage] = useState<string>(allImages[0] || "");
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
    const [ownerSlug, setOwnerSlug] = useState<string>("");
    const [messageForm, setMessageForm] = useState({
        name: "",
        email: "",
        phone: "",
        subject: `Inquiry regarding ${data.title}`,
        message: "",
    });
    const [messageSent, setMessageSent] = useState(false);

    // Menu, Videos, and Q&A state & data normalization
    const [activeMenuTab, setActiveMenuTab] = useState<number>(0);
    const [openQnaIndex, setOpenQnaIndex] = useState<number | null>(0);

    const menuStyle: "1" | "2" | "3" = menuData?.style || "1";
    const menuSections: any[] = Array.isArray(menuData?.sections)
        ? menuData.sections
        : Array.isArray(menuData)
        ? menuData
        : [];

    const videoSections: any[] = Array.isArray(videosData?.sections)
        ? videosData.sections
        : Array.isArray(videosData)
        ? videosData
        : [];

    const qnaItems: any[] = Array.isArray(qnaData?.items)
        ? qnaData.items
        : Array.isArray(qnaData)
        ? qnaData
        : [];

    // Rating Summary Stats for Hero Header
    const [detailRatingStats, setDetailRatingStats] = useState<{ averageRating: number; totalCount: number }>({
        averageRating: 0,
        totalCount: 0,
    });

    useEffect(() => {
        if (!data.id) return;
        fetch(`/api/comments?targetId=${encodeURIComponent(data.id)}&limit=1`)
            .then((r) => r.json())
            .then((res) => {
                if (res.success && res.summary) {
                    setDetailRatingStats({
                        averageRating: res.summary.averageRating || 0,
                        totalCount: res.summary.totalCount || 0,
                    });
                }
            })
            .catch(() => {});
    }, [data.id]);

    // Resolved Category & Location states
    const [resolvedCategory, setResolvedCategory] = useState<{ title: string; url: string } | null>(null);
    const [resolvedLocations, setResolvedLocations] = useState<{ title: string; url: string }[]>([]);

    const catPrefix = (permalinkMap["directory-category"] ?? "directory/category")
        .trim()
        .replace(/^\/+|\/+$/g, "");
    const locationPrefix = (permalinkMap["directory-country"] ?? "directory/country")
        .trim()
        .replace(/^\/+|\/+$/g, "");

    // Resolve owner user slug if ownerUserId exists
    useEffect(() => {
        const targetId = ownerUserId || data.userId || data.info?.userId;
        if (targetId) {
            xFetch(`/chat/conversations?userId=${targetId}`)
                .then((r) => r.json())
                .then((res) => {
                    if (res?.user?.slug) {
                        setOwnerSlug(res.user.slug);
                    }
                })
                .catch(() => {});
        }
    }, [ownerUserId, data.userId, data.info]);

    // Automatically resolve Category and Country/Region/City info if not passed via props
    useEffect(() => {
        // 1. Resolve Category
        if (categoryLinks.length > 0) {
            setResolvedCategory(categoryLinks[0]);
        } else {
            const rawCat = data.category || data.info?.category;
            if (rawCat) {
                let catId = rawCat;
                try {
                    const p = JSON.parse(rawCat);
                    if (p?.id) catId = p.id;
                } catch {
                    /* empty */
                }
                xFetch(`/cat?id=${encodeURIComponent(catId)}`, { cache: "no-store" })
                    .then((r) => r.json())
                    .then((res) => {
                        if (res.cat) {
                            const url = catPrefix ? `/${catPrefix}/${res.cat.slug}` : `/${res.cat.slug}`;
                            setResolvedCategory({ title: res.cat.title, url });
                        }
                    })
                    .catch(() => {});
            }
        }

        // 2. Resolve Country / Region / City location hierarchy
        if (locationLinks.length > 0) {
            setResolvedLocations(locationLinks);
        } else {
            const rawCountry = data.info?.country;
            if (rawCountry) {
                try {
                    const parsed = JSON.parse(rawCountry);
                    const pathIds: string[] = parsed?.path || (parsed?.id ? [parsed.id] : []);
                    if (pathIds.length > 0) {
                        Promise.all(
                            pathIds.map((id) =>
                                xFetch(`/cat?id=${encodeURIComponent(id)}`, { cache: "no-store" }).then((r) =>
                                    r.json()
                                )
                            )
                        )
                            .then((results) => {
                                const list = results
                                    .map((res) => res.cat)
                                    .filter(Boolean)
                                    .map((c) => ({
                                        title: c.title,
                                        url: locationPrefix ? `/${locationPrefix}/${c.slug}` : `/${c.slug}`,
                                    }));
                                setResolvedLocations(list);
                            })
                            .catch(() => {});
                    }
                } catch {
                    /* empty */
                }
            }
        }
    }, [data.category, data.info, categoryLinks, locationLinks, catPrefix, locationPrefix]);

    // Handle submitting inquiry message directly to the Messenger
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isOwnPost) return;

        setIsSubmittingMessage(true);

        const targetId = ownerUserId || data.userId || data.info?.userId;
        const coverImg = allImages[0] || "";

        const fullText = `[Inquiry: ${messageForm.subject}]\nName: ${messageForm.name}\nPhone: ${messageForm.phone}\nEmail: ${messageForm.email}\n\n${messageForm.message}`;

        try {
            if (currentUserId && targetId) {
                await xFetch("/chat/send", {
                    method: "POST",
                    body: JSON.stringify({
                        senderId: currentUserId,
                        receiverId: targetId,
                        message: fullText,
                        productContext: {
                            productId: data.id,
                            title: data.title,
                            image: coverImg,
                            slug: data.slug,
                        },
                    }),
                });
            }
        } catch {
            /* proceed to messenger redirection */
        }

        setMessageSent(true);
        setIsSubmittingMessage(false);

        const chatTarget = ownerSlug || targetId || "messenger";
        const messengerUrl = `/account/messages/${chatTarget}?productId=${encodeURIComponent(data.id)}&productTitle=${encodeURIComponent(data.title)}&productImage=${encodeURIComponent(coverImg)}&productSlug=${encodeURIComponent(data.slug)}`;

        setTimeout(() => {
            setIsMessageModalOpen(false);
            setMessageSent(false);
            router.push(messengerUrl);
        }, 1200);
    };

    // Helper functions for masking contact details for guests
    const maskPhone = (ph: string) => {
        if (!ph) return "";
        return ph.replace(/\d/g, "*");
    };

    const maskEmail = (em: string) => {
        if (!em) return "";
        const parts = em.split("@");
        if (parts.length < 2) return "*****@***.***";
        const name = parts[0];
        const domain = parts[1];
        const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : "***";
        return `${maskedName}@${domain}`;
    };

    const maskWebsite = (ws: string) => {
        if (!ws) return "";
        return "https://***.***";
    };

    const daysList = [
        { key: "monday", label: "Monday" },
        { key: "tuesday", label: "Tuesday" },
        { key: "wednesday", label: "Wednesday" },
        { key: "thursday", label: "Thursday" },
        { key: "friday", label: "Friday" },
        { key: "saturday", label: "Saturday" },
        { key: "sunday", label: "Sunday" },
    ];

    const currentDayKey = new Date()
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

    const targetRecipient = ownerSlug || ownerUserId || data.userId || data.info?.userId;
    const directChatUrl = targetRecipient
        ? `/account/messages/${targetRecipient}?productId=${encodeURIComponent(data.id)}&productTitle=${encodeURIComponent(data.title)}&productImage=${encodeURIComponent(allImages[0] || "")}&productSlug=${encodeURIComponent(data.slug)}`
        : "/account/messages";

    return (
        <div className="container py-8 space-y-8 font-sans">
            {/* Breadcrumb Header */}
            <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <Link href="/" className="hover:text-main transition">
                    Home
                </Link>
                {resolvedCategory && (
                    <span className="flex items-center gap-2">
                        <span className="text-gray-300">/</span>
                        <Link href={resolvedCategory.url} className="hover:text-main transition font-medium">
                            {resolvedCategory.title}
                        </Link>
                    </span>
                )}
                <span className="text-gray-300">/</span>
                <span className="text-gray-800 font-semibold truncate">{data.title}</span>
            </nav>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Gallery & Description (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Hero Title & Location Badges */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                        <Icon icon="solar:verified-check-bold" className="w-3.5 h-3.5" />
                                        Verified Listing
                                    </span>
                                    {resolvedCategory && (
                                        <Link
                                            href={resolvedCategory.url}
                                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-main hover:bg-indigo-100 transition"
                                        >
                                            {resolvedCategory.title}
                                        </Link>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                    {data.title}
                                </h1>

                                {/* Review Rating Score & Total Review Count Badge */}
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                                        <Icon icon="solar:star-bold" className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-black text-gray-900">
                                            {detailRatingStats.averageRating > 0 ? detailRatingStats.averageRating.toFixed(1) : "0.0"}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600">
                                        {detailRatingStats.totalCount > 0
                                            ? `${detailRatingStats.totalCount} customer review${detailRatingStats.totalCount > 1 ? "s" : ""}`
                                            : "No reviews yet"}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                {isOwnPost ? (
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                                            <Icon icon="solar:user-bold" className="w-4 h-4 text-main" />
                                            Your Listing
                                        </span>
                                        <Link
                                            href={`/account/directory/posts/${data.id}`}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-main hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
                                        >
                                            <Icon icon="solar:pen-bold" className="w-4 h-4" />
                                            Edit Listing
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isLogged) {
                                                    window.location.href = "/login";
                                                    return;
                                                }
                                                setIsMessageModalOpen(true);
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-main hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition active:scale-[0.98]"
                                        >
                                            <Icon icon="solar:letter-bold" className="w-4 h-4" />
                                            {isLogged ? "Send Inquiry" : "Login to Inquire"}
                                        </button>

                                        {isLogged && (
                                            <Link
                                                href={directChatUrl}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm"
                                                title="Chat in Messenger"
                                            >
                                                <Icon icon="griddy-icons:chat" className="w-4 h-4" />
                                                <span>Chat</span>
                                            </Link>
                                        )}

                                        {contactData.mobile && isLogged && (
                                            <a
                                                href={`https://wa.me/${contactData.mobile.replace(/[^0-9+]/g, "")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm"
                                                title="WhatsApp"
                                            >
                                                <Icon icon="logos:whatsapp-icon" className="w-4 h-4 brightness-200" />
                                            </a>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Location Path (Country -> Region -> City) */}
                        {resolvedLocations.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-3 border-t border-gray-100 flex-wrap">
                                <Icon icon="solar:map-point-bold" className="w-4 h-4 text-main shrink-0" />
                                <span className="font-semibold text-gray-700">Country & Region:</span>
                                {resolvedLocations.map((loc, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                        {i > 0 && <span className="text-gray-300">›</span>}
                                        <Link
                                            href={loc.url}
                                            className="font-medium text-main hover:text-indigo-800 hover:underline"
                                        >
                                            {loc.title}
                                        </Link>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Image Gallery */}
                    {allImages.length > 0 && (
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
                                <img
                                    src={selectedImage || allImages[0]}
                                    alt={data.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {allImages.length > 1 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                    {allImages.map((img, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setSelectedImage(img)}
                                            className={`relative w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                                                selectedImage === img
                                                    ? "border-main ring-2 ring-indigo-200"
                                                    : "border-transparent opacity-75 hover:opacity-100"
                                            }`}
                                        >
                                            <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description Section */}
                    {description && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Icon icon="solar:document-text-bold" className="w-5 h-5 text-main" />
                                About Business
                            </h2>
                            <div
                                className="prose prose-sm max-w-none text-gray-700 leading-relaxed description"
                                dangerouslySetInnerHTML={{ __html: description }}
                            />
                        </div>
                    )}

                    {/* directory-attributes */}
                    <DirectoryAttributeDetails info={data.info} />

                    {/* Menu & Pricing Section */}
                    {menuSections.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Icon icon="solar:hamburger-menu-bold" className="w-5 h-5 text-main" />
                                    Menu & Pricing
                                </h2>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-main">
                                    Style {menuStyle}
                                </span>
                            </div>

                            {/* Menu Style 1: List */}
                            {menuStyle === "1" && (
                                <div className="space-y-6">
                                    {menuSections.map((sec: any, secIdx: number) => (
                                        <div key={secIdx} className="space-y-3">
                                            {sec.title && (
                                                <h3 className="text-base font-extrabold text-gray-900 border-b-2 border-main pb-1 inline-block">
                                                    {sec.title}
                                                </h3>
                                            )}
                                            <div className="divide-y divide-gray-100">
                                                {(sec.items || []).map((item: any, itemIdx: number) => (
                                                    <div key={itemIdx} className="py-3.5 space-y-2 group">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="space-y-1">
                                                                <h4 className="text-sm font-bold text-gray-900 group-hover:text-main transition">
                                                                    {item.title}
                                                                </h4>
                                                                {item.subtitle && (
                                                                    <p className="text-xs text-gray-500 leading-relaxed">
                                                                        {item.subtitle}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {item.prices && (
                                                                <span className="shrink-0 text-xs font-extrabold text-main bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
                                                                    {item.prices}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {Array.isArray(item.images) && item.images.length > 0 && (
                                                            <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                                                {item.images.map((img: string, imgIdx: number) => (
                                                                    <img
                                                                        key={imgIdx}
                                                                        src={img}
                                                                        alt={item.title || "Menu image"}
                                                                        onClick={() => setSelectedImage(img)}
                                                                        className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-90 transition border border-gray-100"
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Menu Style 2: Left Titles Navigation + All Menus Visible */}
                            {menuStyle === "2" && (
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Left Column: Category Titles */}
                                    <div className="md:w-52 shrink-0 space-y-1.5 md:sticky md:top-6 self-start bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-2 block mb-1">
                                            Categories
                                        </span>
                                        {menuSections.map((sec: any, secIdx: number) => (
                                            <button
                                                key={secIdx}
                                                type="button"
                                                onClick={() => {
                                                    setActiveMenuTab(secIdx);
                                                    const el = document.getElementById(`menu-cat-${secIdx}`);
                                                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                                                    activeMenuTab === secIdx
                                                        ? "bg-main text-white shadow-sm"
                                                        : "text-gray-700 hover:bg-gray-200/60"
                                                }`}
                                            >
                                                <span className="truncate">{sec.title || `Category ${secIdx + 1}`}</span>
                                                <span className="text-[10px] opacity-75 font-normal ml-1">
                                                    ({sec.items?.length || 0})
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Right Column: All Menus visible sequentially */}
                                    <div className="flex-1 space-y-8">
                                        {menuSections.map((sec: any, secIdx: number) => (
                                            <div
                                                key={secIdx}
                                                id={`menu-cat-${secIdx}`}
                                                className="space-y-4 pt-2 border-b border-gray-100 last:border-0 pb-6"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-main" />
                                                    <h3 className="text-base font-extrabold text-gray-900">
                                                        {sec.title || `Category ${secIdx + 1}`}
                                                    </h3>
                                                </div>

                                                <div className="space-y-3">
                                                    {(sec.items || []).map((item: any, itemIdx: number) => (
                                                        <div
                                                            key={itemIdx}
                                                            className="p-4 bg-gray-50/60 rounded-xl border border-gray-100 space-y-2 hover:border-indigo-100 transition"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-gray-900">
                                                                        {item.title}
                                                                    </h4>
                                                                    {item.subtitle && (
                                                                        <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                                                                            {item.subtitle}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {item.prices && (
                                                                    <span className="shrink-0 text-xs font-bold text-main bg-white border border-indigo-100 px-2.5 py-1 rounded-lg shadow-2xs">
                                                                        {item.prices}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {Array.isArray(item.images) && item.images.length > 0 && (
                                                                <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                                                    {item.images.map((img: string, imgIdx: number) => (
                                                                        <img
                                                                            key={imgIdx}
                                                                            src={img}
                                                                            alt={item.title}
                                                                            onClick={() => setSelectedImage(img)}
                                                                            className="w-14 h-14 rounded-lg object-cover cursor-pointer hover:opacity-90 transition border border-gray-200"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Menu Style 3: Card Grid */}
                            {menuStyle === "3" && (
                                <div className="space-y-6">
                                    {menuSections.map((sec: any, secIdx: number) => (
                                        <div key={secIdx} className="space-y-4">
                                            {sec.title && (
                                                <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-100 pb-2">
                                                    {sec.title}
                                                </h3>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {(sec.items || []).map((item: any, itemIdx: number) => (
                                                    <div
                                                        key={itemIdx}
                                                        className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition space-y-3 flex flex-col justify-between"
                                                    >
                                                        <div className="space-y-2">
                                                            {Array.isArray(item.images) && item.images.length > 0 && (
                                                                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
                                                                    <img
                                                                        src={item.images[0]}
                                                                        alt={item.title}
                                                                        onClick={() => setSelectedImage(item.images[0])}
                                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-300"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <h4 className="text-sm font-bold text-gray-900 leading-snug">
                                                                    {item.title}
                                                                </h4>
                                                                {item.prices && (
                                                                    <span className="shrink-0 text-xs font-extrabold text-main bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                                        {item.prices}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.subtitle && (
                                                                <p className="text-xs text-gray-500 line-clamp-2">
                                                                    {item.subtitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Videos Section */}
                    {videoSections.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Icon icon="solar:videocamera-record-bold" className="w-5 h-5 text-main" />
                                Video Showcase
                            </h2>

                            <div className="space-y-8">
                                {videoSections.map((sec: any, secIdx: number) => (
                                    <div key={secIdx} className="space-y-4">
                                        {sec.title && (
                                            <h3 className="text-base font-extrabold text-gray-900">
                                                {sec.title}
                                            </h3>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(sec.items || []).map((item: any, itemIdx: number) => {
                                                const vids = Array.isArray(item.videos) ? item.videos : item.videos ? [item.videos] : [];
                                                const imgs = Array.isArray(item.images) ? item.images : item.images ? [item.images] : [];
                                                const firstVid = vids[0] || "";
                                                const ytEmbed = getYouTubeEmbedUrl(firstVid);

                                                return (
                                                    <div
                                                        key={itemIdx}
                                                        className="p-4 rounded-xl border border-gray-100 bg-gray-50/70 space-y-3"
                                                    >
                                                        {item.title && (
                                                            <h4 className="text-sm font-bold text-gray-900">
                                                                {item.title}
                                                            </h4>
                                                        )}

                                                        {/* Video Player */}
                                                        {ytEmbed ? (
                                                            <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-2xs">
                                                                <iframe
                                                                    src={ytEmbed}
                                                                    title={item.title || "Video"}
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                    className="w-full h-full border-0"
                                                                />
                                                            </div>
                                                        ) : firstVid ? (
                                                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xs">
                                                                <video
                                                                    src={firstVid}
                                                                    controls
                                                                    preload="metadata"
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </div>
                                                        ) : null}

                                                        {/* Images gallery */}
                                                        {imgs.length > 0 && (
                                                            <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                                                {imgs.map((img: string, imgIdx: number) => (
                                                                    <img
                                                                        key={imgIdx}
                                                                        src={img}
                                                                        alt="Video thumbnail"
                                                                        onClick={() => setSelectedImage(img)}
                                                                        className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-90 transition border border-gray-200"
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Q&A Section */}
                    {qnaItems.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Icon icon="solar:question-square-bold" className="w-5 h-5 text-main" />
                                Frequently Asked Questions
                            </h2>

                            <div className="space-y-3">
                                {qnaItems.map((item: any, idx: number) => {
                                    const isOpen = openQnaIndex === idx;
                                    return (
                                        <div
                                            key={idx}
                                            className="border border-gray-100 rounded-xl overflow-hidden transition"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenQnaIndex(isOpen ? null : idx)}
                                                className="w-full p-4 text-left font-bold text-sm text-gray-900 bg-gray-50/80 hover:bg-gray-100/80 transition flex items-center justify-between gap-3"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-main flex items-center justify-center text-xs font-extrabold shrink-0">
                                                        Q
                                                    </span>
                                                    {item.q}
                                                </span>
                                                <Icon
                                                    icon="solar:alt-arrow-down-bold"
                                                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                                        isOpen ? "rotate-180 text-main" : ""
                                                    }`}
                                                />
                                            </button>
                                            {isOpen && item.a && (
                                                <div className="p-4 bg-white border-t border-gray-100 text-xs text-gray-700 leading-relaxed space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                                                            A
                                                        </span>
                                                        <p className="whitespace-pre-line flex-1 pt-0.5">{item.a}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Reviews & Ratings Section (Modular Component) */}
                    <DirectoryReviews
                        targetId={data.id}
                        ownerUserId={ownerUserId}
                        isOwnPost={isOwnPost}
                    />
                </div>

                {/* Right Column: Business Contact, Opening Hours, Social (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Business Contact Card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <Icon icon="solar:user-id-bold" className="w-4 h-4 text-main" />
                                Business Contact
                            </h3>
                            {isOwnPost ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-main border border-indigo-200">
                                    Your Post
                                </span>
                            ) : (
                                !isLogged && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                        <Icon icon="solar:lock-keyhole-bold" className="w-3 h-3" />
                                        Private
                                    </span>
                                )
                            )}
                        </div>

                        {!isLogged && (
                            <div className="bg-amber-50/80 border border-amber-200/70 p-3 rounded-xl flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 text-amber-900">
                                    <Icon icon="solar:lock-bold" className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>Contact details are private</span>
                                </div>
                                <Link
                                    href="/login"
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shrink-0"
                                >
                                    Login to view
                                </Link>
                            </div>
                        )}

                        <div className="space-y-3.5 text-xs">
                            {contactData.position && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-main shrink-0">
                                        <Icon icon="solar:user-speak-bold" className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Position</span>
                                        <span className="font-bold text-gray-800">{contactData.position}</span>
                                    </div>
                                </div>
                            )}

                            {contactData.name && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-main shrink-0">
                                        <Icon icon="solar:user-bold" className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Full Name</span>
                                        <span className="font-bold text-gray-800">{contactData.name}</span>
                                    </div>
                                </div>
                            )}

                            {contactData.mobile && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                        <Icon icon="solar:phone-calling-bold" className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Mobile</span>
                                        {isLogged ? (
                                            <a href={`tel:${contactData.mobile}`} className="font-bold text-emerald-600 hover:underline">
                                                {contactData.mobile}
                                            </a>
                                        ) : (
                                            <span className="font-mono text-gray-500 font-semibold select-none">
                                                {maskPhone(contactData.mobile)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {contactData.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-main shrink-0">
                                        <Icon icon="solar:phone-bold" className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Phone</span>
                                        {isLogged ? (
                                            <a href={`tel:${contactData.phone}`} className="font-bold text-gray-800 hover:underline">
                                                {contactData.phone}
                                            </a>
                                        ) : (
                                            <span className="font-mono text-gray-500 font-semibold select-none">
                                                {maskPhone(contactData.phone)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {contactData.email && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-main shrink-0">
                                        <Icon icon="solar:letter-bold" className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Email</span>
                                        {isLogged ? (
                                            <a href={`mailto:${contactData.email}`} className="font-bold text-main hover:underline block truncate">
                                                {contactData.email}
                                            </a>
                                        ) : (
                                            <span className="font-mono text-gray-500 font-semibold select-none block truncate">
                                                {maskEmail(contactData.email)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {contactData.website && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-main shrink-0">
                                        <Icon icon="solar:globus-bold" className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-gray-400 block text-[10px] uppercase font-semibold">Website</span>
                                        {isLogged ? (
                                            <a
                                                href={contactData.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-main hover:underline block truncate"
                                            >
                                                {contactData.website.replace(/^https?:\/\//, "")}
                                            </a>
                                        ) : (
                                            <span className="font-mono text-gray-500 font-semibold select-none block truncate">
                                                {maskWebsite(contactData.website)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Button: Own Post vs Chat vs Login */}
                        {isOwnPost ? (
                            <Link
                                href={`/account/directory/posts/${data.id}`}
                                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-2 border border-indigo-100"
                            >
                                <Icon icon="solar:pen-bold" className="w-4 h-4 text-main" />
                                Edit Your Listing
                            </Link>
                        ) : isLogged ? (
                            <Link
                                href={directChatUrl}
                                className="w-full py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition flex items-center justify-center gap-2"
                            >
                                <Icon icon="griddy-icons:chat" className="w-4 h-4 text-orange-500" />
                                Open Messenger Chat
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-2"
                            >
                                <Icon icon="solar:lock-keyhole-bold" className="w-4 h-4 text-main" />
                                Login to Contact Owner
                            </Link>
                        )}
                    </div>

                    {/* Address & ZIP Card */}
                    {(addressData.address || addressData.zipCode) && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Icon icon="solar:map-point-bold" className="w-4 h-4 text-main" />
                                Address Details
                            </h3>
                            <div className="text-xs space-y-2 text-gray-700">
                                {addressData.address && (
                                    <p className="flex items-start gap-2">
                                        <Icon icon="solar:home-2-bold" className="w-4 h-4 text-main shrink-0 mt-0.5" />
                                        <span>{addressData.address}</span>
                                    </p>
                                )}
                                {addressData.zipCode && (
                                    <p className="flex items-center gap-2">
                                        <Icon icon="solar:mailbox-bold" className="w-4 h-4 text-main shrink-0" />
                                        <span>ZIP / Postal Code: <strong>{addressData.zipCode}</strong></span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Google Map */}
                    {addressData.address && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                <Icon icon="logos:google-maps" className="w-4 h-4" />
                                Location on Map
                            </h3>

                            <div className="rounded-xl overflow-hidden">
                                <iframe
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                        addressData.address
                                    )}&z=15&output=embed`}
                                    width="100%"
                                    height="350"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="w-full rounded-xl"
                                    title="Google Map"
                                />
                            </div>
                        </div>
                    )}
                    {/* Opening Times Card */}
                    {Object.keys(openingTimesData).length > 0 && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Icon icon="solar:clock-circle-bold" className="w-4 h-4 text-main" />
                                Opening Hours
                            </h3>
                            <div className="space-y-2 text-xs">
                                {daysList.map((day) => {
                                    const sched = openingTimesData[day.key];
                                    const isToday = day.key === currentDayKey;
                                    return (
                                        <div
                                            key={day.key}
                                            className={`flex items-center justify-between py-1 px-2 rounded-lg transition ${
                                                isToday ? "bg-indigo-50/80 font-bold text-indigo-900" : "text-gray-700"
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-main" />}
                                                {day.label}
                                            </span>
                                            {sched?.status === "open_24h" ? (
                                                <span className="text-emerald-600 font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-50">
                                                    Open 24/7
                                                </span>
                                            ) : sched?.status === "closed" ? (
                                                <span className="text-red-500 font-semibold text-[11px] px-2 py-0.5 rounded bg-red-50">
                                                    Closed
                                                </span>
                                            ) : sched?.openTime && sched?.closeTime ? (
                                                <span className="font-semibold text-gray-800">
                                                    {sched.openTime} - {sched.closeTime}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">N/A</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Social Media Links */}
                    {socialData.length > 0 && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Icon icon="solar:share-circle-bold" className="w-4 h-4 text-main" />
                                Social Media
                            </h3>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                {socialData.map((soc, i) => {
                                    const icon = SOCIAL_ICONS[soc.platform.toLowerCase()] || "solar:link-bold";
                                    return (
                                        <a
                                            key={i}
                                            href={soc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-main transition flex items-center gap-2 text-xs font-semibold border border-gray-100"
                                            title={soc.platform}
                                        >
                                            <Icon icon={icon} className="w-4 h-4" />
                                            <span>{soc.platform}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Related Directory Posts / Products (10 items, 5 per line) */}
            <DirectoryRelated
                categoryId={data.category}
                currentId={data.id}
                directoryPrefix={catPrefix}
                permalinkMap={permalinkMap}
                categoryUrl={resolvedCategory?.url}
            />

            {/* Messaging Inquiry Modal */}
            {isMessageModalOpen && isLogged && !isOwnPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={() => setIsMessageModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                        >
                            <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-main flex items-center justify-center">
                                <Icon icon="solar:letter-bold" className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Send Inquiry to Messenger</h3>
                                <p className="text-xs text-gray-500">Contact {data.title}</p>
                            </div>
                        </div>

                        {messageSent ? (
                            <div className="py-8 text-center space-y-3">
                                <Icon icon="solar:check-circle-bold" className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                                <h4 className="text-base font-bold text-gray-900">Sending to Messenger…</h4>
                                <p className="text-xs text-gray-500">
                                    Your inquiry is being routed to the chat messenger.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={messageForm.name}
                                        onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-main"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={messageForm.email}
                                            onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                                            placeholder="you@email.com"
                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-main"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={messageForm.phone}
                                            onChange={(e) => setMessageForm({ ...messageForm, phone: e.target.value })}
                                            placeholder="+1 234 567 890"
                                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-main"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={messageForm.subject}
                                        onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-main"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Message</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={messageForm.message}
                                        onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                                        placeholder="Write your message here..."
                                        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs outline-none focus:border-main resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmittingMessage}
                                    className="w-full py-3 px-4 rounded-xl bg-main hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmittingMessage ? (
                                        <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
                                    ) : (
                                        <Icon icon="griddy-icons:chat" className="w-4 h-4 text-orange-400" />
                                    )}
                                    {isSubmittingMessage ? "Sending…" : "Send Message to Messenger"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
