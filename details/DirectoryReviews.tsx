"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useUser } from "@/context/Provider";
import Gallery from "@/components/Gallery";

export interface DirectoryReviewsProps {
    targetId: string;
    ownerUserId?: string;
    isOwnPost?: boolean;
}

export default function DirectoryReviews({
    targetId,
    ownerUserId = "",
    isOwnPost = false,
}: DirectoryReviewsProps) {
    const { user } = useUser();
    const isLogged = Boolean(user);
    const currentUserId = user?._id ? String(user._id) : "";

    // Reviews State
    const [reviews, setReviews] = useState<any[]>([]);
    const [userPendingReview, setUserPendingReview] = useState<any | null>(null);
    const [reviewSummary, setReviewSummary] = useState<{
        averageRating: number;
        totalCount: number;
        distribution: Record<number, number>;
    }>({
        averageRating: 0,
        totalCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    });
    const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
    const [reviewPage, setReviewPage] = useState<number>(1);
    const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(false);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [ratingInput, setRatingInput] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [descriptionInput, setDescriptionInput] = useState<string>("");
    const [mediaAttachments, setMediaAttachments] = useState<string[]>([]);
    const [submittingReview, setSubmittingReview] = useState<boolean>(false);
    const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>("");
    const [reviewErrorMsg, setReviewErrorMsg] = useState<string>("");

    // Lightbox modal state for review images
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchReviews = async (pageToFetch = 1, append = false) => {
        if (!targetId) return;
        setLoadingReviews(true);
        try {
            const res = await fetch(
                `/api/comments?targetId=${encodeURIComponent(targetId)}&targetType=directory&userId=${encodeURIComponent(
                    currentUserId || ""
                )}&ownerId=${encodeURIComponent(ownerUserId)}&page=${pageToFetch}&limit=5`
            );
            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    if (append) {
                        setReviews((prev) => [...prev, ...(json.data || [])]);
                    } else {
                        setReviews(json.data || []);
                    }
                    if (json.summary) {
                        setReviewSummary(json.summary);
                    }
                    setUserPendingReview(json.userPendingReview || null);
                    setHasMoreReviews(json.pagination?.hasMore ?? false);
                    setReviewPage(pageToFetch);
                }
            }
        } catch (e) {
            console.error("Failed to load reviews:", e);
        } finally {
            setLoadingReviews(false);
        }
    };

    useEffect(() => {
        fetchReviews(1, false);
    }, [targetId, currentUserId, ownerUserId]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLogged) return;
        if (isOwnPost) {
            setReviewErrorMsg("You cannot review your own listing.");
            return;
        }
        if (!descriptionInput.trim()) {
            setReviewErrorMsg("Please enter a review description.");
            return;
        }

        setSubmittingReview(true);
        setReviewErrorMsg("");
        setReviewSuccessMsg("");

        try {
            const images = mediaAttachments.filter(
                (url) => !url.match(/\.(mp4|webm|ogg|mov|mkv|avi)$/i)
            );
            const videos = mediaAttachments.filter((url) =>
                url.match(/\.(mp4|webm|ogg|mov|mkv|avi)$/i)
            );

            const userName = user?.name || (user as any)?.username || "Member";
            const userImg = (user as any)?.image || (user as any)?.picture || "";

            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetType: "directory",
                    targetId,
                    ownerId: ownerUserId,
                    userId: currentUserId,
                    userName,
                    userImage: userImg,
                    rating: ratingInput,
                    content: descriptionInput,
                    images,
                    videos,
                }),
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setReviewSuccessMsg("Your review has been submitted and is pending approval by the owner.");
                    setDescriptionInput("");
                    setMediaAttachments([]);
                    setRatingInput(5);
                    setIsFormOpen(false);
                    fetchReviews(1, false);
                } else {
                    setReviewErrorMsg(json.error || "Failed to submit review.");
                }
            } else {
                setReviewErrorMsg("Failed to submit review.");
            }
        } catch {
            setReviewErrorMsg("Network error when submitting review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            {/* Section Title & Action Button */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Icon icon="solar:star-bold" className="w-5 h-5 text-amber-400" />
                        Customer Reviews & Ratings
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {reviewSummary.totalCount > 0
                            ? `${reviewSummary.totalCount} verified review${reviewSummary.totalCount > 1 ? "s" : ""}`
                            : "Be the first to share your experience"}
                    </p>
                </div>

                {/* Action Buttons */}
                {isOwnPost ? (
                    <Link
                        href="/account/directory/reviews"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition"
                    >
                        <Icon icon="solar:shield-check-bold" className="w-4 h-4 text-main" />
                        Manage Reviews in User Panel
                    </Link>
                ) : isLogged ? (
                    <button
                        type="button"
                        onClick={() => {
                            setIsFormOpen(!isFormOpen);
                            setReviewSuccessMsg("");
                            setReviewErrorMsg("");
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-main hover:bg-main/80 text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                        <Icon icon={isFormOpen ? "solar:close-circle-bold" : "solar:pen-new-square-bold"} className="w-4 h-4" />
                        {isFormOpen ? "Close Form" : "Write a Review"}
                    </button>
                ) : (
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
                    >
                        <Icon icon="solar:lock-keyhole-bold" className="w-4 h-4 text-gray-500" />
                        Login to Write a Review
                    </Link>
                )}
            </div>

            {/* Rating Summary Breakdown */}
            {reviewSummary.totalCount > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gray-50/70 p-4 rounded-2xl border border-gray-100 items-center">
                    {/* Big Score Badge */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-4 text-center">
                        <span className="text-4xl font-black text-gray-900 leading-none">
                            {reviewSummary.averageRating}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-400 my-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                    key={star}
                                    icon="solar:star-bold"
                                    className={`w-4 h-4 ${
                                        star <= Math.round(reviewSummary.averageRating)
                                            ? "text-amber-400"
                                            : "text-gray-200"
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-semibold text-gray-500">
                            Out of 5 stars ({reviewSummary.totalCount})
                        </span>
                    </div>

                    {/* Distribution Progress Bars */}
                    <div className="md:col-span-8 space-y-1.5 text-xs">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviewSummary.distribution[star] || 0;
                            const pct = reviewSummary.totalCount > 0 ? (count / reviewSummary.totalCount) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="w-8 text-right font-bold text-gray-600 flex items-center justify-end gap-0.5">
                                        {star} <Icon icon="solar:star-bold" className="w-3 h-3 text-amber-400 inline" />
                                    </span>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-xs text-gray-400 font-medium text-right">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Pending Notice for Regular Users */}
            {userPendingReview && !isOwnPost && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                            <Icon icon="solar:clock-circle-bold" className="w-4 h-4 text-amber-600" />
                            Your Review is Pending Owner Approval
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-200/80 text-[10px] uppercase tracking-wider font-extrabold text-amber-800">
                            Pending Review
                        </span>
                    </div>
                    <div className="text-xs text-amber-900/90 bg-white/70 p-3 rounded-xl border border-amber-100 space-y-1">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Icon
                                    key={s}
                                    icon="solar:star-bold"
                                    className={`w-3.5 h-3.5 ${s <= userPendingReview.rating ? "text-amber-400" : "text-gray-200"}`}
                                />
                            ))}
                        </div>
                        <p className="whitespace-pre-line text-xs italic">{userPendingReview.content}</p>
                    </div>
                    <p className="text-[11px] text-amber-800">
                        The listing owner has been notified to review and approve your submission.
                    </p>
                </div>
            )}

            {/* Collapsible Write a Review Form */}
            {isFormOpen && isLogged && !isOwnPost && (
                <form onSubmit={handleSubmitReview} className="bg-gray-50/90 border border-indigo-100 rounded-2xl p-5 space-y-4 shadow-xs animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Icon icon="solar:pen-bold" className="w-4 h-4 text-main/80" />
                            Write a Verified Review
                        </h3>
                        <span className="text-[11px] text-gray-500 font-semibold">
                            Posting as <strong>{user?.name || "Member"}</strong>
                        </span>
                    </div>

                    {reviewSuccessMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-500 shrink-0" />
                            {reviewSuccessMsg}
                        </div>
                    )}

                    {reviewErrorMsg && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <Icon icon="solar:danger-bold" className="w-4 h-4 text-red-500 shrink-0" />
                            {reviewErrorMsg}
                        </div>
                    )}

                    {/* Interactive Star Picker */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 block">
                            Your Rating: <strong className="text-amber-500">{ratingInput} Star{ratingInput > 1 ? "s" : ""}</strong>
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRatingInput(star)}
                                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                                >
                                    <Icon
                                        icon="solar:star-bold"
                                        className={`w-6 h-6 transition-colors ${
                                            star <= (hoverRating || ratingInput)
                                                ? "text-amber-400"
                                                : "text-gray-300"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Line-by-Line Textarea Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 block">
                            Review Description (Line by Line)
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={descriptionInput}
                            onChange={(e) => setDescriptionInput(e.target.value)}
                            placeholder="Write your detailed experience here... Press Enter for new lines."
                            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:border-main/80 transition leading-relaxed whitespace-pre-line resize-y"
                        />
                        <p className="text-[10px] text-gray-400">
                            Text will be formatted line by line as written above.
                        </p>
                    </div>

                    {/* Media Uploads via Gallery component */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <Icon icon="solar:gallery-wide-bold" className="w-3.5 h-3.5 text-main/80" />
                            Upload Review Photos & Videos (Gallery)
                        </label>
                        <Gallery
                            multiple={true}
                            value={mediaAttachments}
                            onChange={(val) => {
                                const imgs = Array.isArray(val) ? val : val ? [val] : [];
                                setMediaAttachments(imgs);
                            }}
                            placeholder="Add photos or videos to your review"
                        />
                    </div>

                    {/* Submit button */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submittingReview}
                            className="px-5 py-2 rounded-xl bg-main hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {submittingReview ? (
                                <>
                                    <Icon icon="svg-spinners:ring-resize" className="w-4 h-4" />
                                    Submitting…
                                </>
                            ) : (
                                <>
                                    <Icon icon="solar:send-bold" className="w-4 h-4" />
                                    Submit Review for Approval
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Approved Public Reviews List */}
            <div className="space-y-4 pt-2">
                {loadingReviews && reviews.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-main/80">
                        <Icon icon="svg-spinners:ring-resize" className="w-6 h-6" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 space-y-2">
                        <Icon icon="solar:chat-line-bold-duotone" className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-xs font-semibold text-gray-500">No approved reviews yet.</p>
                        {!isOwnPost && isLogged && (
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(true)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-main text-white text-xs font-bold hover:bg-indigo-700 transition"
                            >
                                Write the First Review
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((rev) => (
                            <div
                                key={rev._id}
                                className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 transition space-y-3 shadow-2xs"
                            >
                                {/* Header: User avatar, name, date, rating */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {rev.userImage ? (
                                            <img
                                                src={rev.userImage}
                                                alt={rev.userName}
                                                className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                {rev.userName?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-900">{rev.userName}</h4>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(rev.createdAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-amber-400">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Icon
                                                key={star}
                                                icon="solar:star-bold"
                                                className={`w-3.5 h-3.5 ${
                                                    star <= rev.rating ? "text-amber-400" : "text-gray-200"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Line-by-Line Formatted Description */}
                                <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed font-sans">
                                    {rev.content}
                                </p>

                                {/* Attached Gallery Media (Images & Videos) */}
                                {((rev.images && rev.images.length > 0) || (rev.videos && rev.videos.length > 0)) && (
                                    <div className="flex items-center gap-2 overflow-x-auto pt-1">
                                        {(rev.images || []).map((img: string, i: number) => (
                                            <img
                                                key={i}
                                                src={img}
                                                alt="Review attachment"
                                                onClick={() => setPreviewImage(img)}
                                                className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-90 transition border border-gray-100 shadow-2xs"
                                            />
                                        ))}
                                        {(rev.videos || []).map((vid: string, i: number) => (
                                            <video
                                                key={i}
                                                src={vid}
                                                controls
                                                className="w-24 h-16 rounded-lg object-cover bg-black"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Owner Reply if present */}
                                {rev.reply?.content && (
                                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs space-y-1 ml-4 mt-2">
                                        <span className="font-bold text-indigo-900 flex items-center gap-1 text-[11px]">
                                            <Icon icon="solar:user-bold" className="w-3.5 h-3.5 text-main" />
                                            Response from Owner
                                        </span>
                                        <p className="text-indigo-950 whitespace-pre-line text-xs">{rev.reply.content}</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Pagination / Load More */}
                        {hasMoreReviews && (
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => fetchReviews(reviewPage + 1, true)}
                                    disabled={loadingReviews}
                                    className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                    {loadingReviews ? (
                                        <Icon icon="svg-spinners:ring-resize" className="w-3.5 h-3.5" />
                                    ) : (
                                        <Icon icon="solar:alt-arrow-down-bold" className="w-3.5 h-3.5" />
                                    )}
                                    Load More Reviews
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Lightbox Modal for Review Images */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={previewImage}
                            alt="Full preview"
                            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
                        />
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition p-2"
                        >
                            <Icon icon="solar:close-circle-bold" className="w-7 h-7" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
