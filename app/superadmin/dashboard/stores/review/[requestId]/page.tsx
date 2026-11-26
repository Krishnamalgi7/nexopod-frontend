"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  LoaderCircle,
  Store,
  AlertCircle,
  Check,
  X,
  Image as ImageIcon,
  Clock3,
  Phone,
  MapPin,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

import {
  getStoreProfileReview,
  approveStoreProfileReview,
  rejectStoreProfileReview,
  type StoreProfileReviewRequest,
} from "@/services/superadmin/storeProfileReviewService";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import API_BASE_URL from "@/services/common/api";
import { getPendingStoreProfileImage } from "@/services/superadmin/storeProfileReviewService";

export default function StoreProfileReviewPage() {
  const params = useParams<{ requestId: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<StoreProfileReviewRequest | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<
    "approve" | "reject" | null
  >(null);

  const [actionError, setActionError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [requestedMainImage, setRequestedMainImage] = useState("");
  const [requestedGalleryImages, setRequestedGalleryImages] = useState<
    string[]
  >([]);

  useEffect(() => {
    let isMounted = true;

    const loadRequest = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getStoreProfileReview(params.requestId);

        if (isMounted) {
          setRequest(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the review request.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (params.requestId) {
      loadRequest();
    }

    return () => {
      isMounted = false;
    };
  }, [params.requestId]);

  const handleApprove = async () => {
    try {
      setActionLoading("approve");
      setActionError("");

      await approveStoreProfileReview(params.requestId);

      router.push("/superadmin/dashboard/store-requests");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to approve this request.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setActionError("Please enter a reason for rejecting this request.");
      return;
    }

    try {
      setActionLoading("reject");
      setActionError("");

      await rejectStoreProfileReview(params.requestId, rejectReason.trim());

      router.push("/superadmin/dashboard/store-requests");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to reject this request.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (!request || request.status !== "pending") return;

    let isMounted = true;
    const objectUrls: string[] = [];

    console.log("Current store image:", request.storeId?.image);
    console.log("Proposed store image:", request.proposedProfile.image);

    const loadRequestedImages = async () => {
      try {
        if (
          request.proposedProfile.image?.path &&
          request.proposedProfile.image.path !== request.storeId?.image?.path
        ) {
          const blob = await getPendingStoreProfileImage(
            params.requestId,
            "main",
          );

          if (!isMounted) return;

          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          setRequestedMainImage(url);
        }

        console.log("Current gallery images:", request.storeId?.images);
        console.log("Proposed gallery images:", request.proposedProfile.images);
        const currentGallery = request.storeId?.images || [];
        const proposedGallery = request.proposedProfile.images || [];

        const currentGalleryPaths = new Set(
          currentGallery.map((image) => image.path),
        );

        const galleryUrls: string[] = [];

        for (let index = 0; index < proposedGallery.length; index++) {
          const proposedImage = proposedGallery[index];

          // Skip images that already exist in the current store profile.
          if (currentGalleryPaths.has(proposedImage.path)) {
            continue;
          }

          try {
            const blob = await getPendingStoreProfileImage(
              params.requestId,
              "gallery",
              index,
            );

            if (!isMounted) return;

            const url = URL.createObjectURL(blob);
            objectUrls.push(url);
            galleryUrls.push(url);
          } catch (imageError) {
            console.error(
              `Unable to load new gallery image ${index + 1}:`,
              imageError,
            );
          }
        }

        if (isMounted) {
          setRequestedGalleryImages(galleryUrls);
        }
      } catch (imageError) {
        console.error("Unable to load requested store images:", imageError);
      }
    };

    loadRequestedImages();

    return () => {
      isMounted = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [request, params.requestId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f9f8] px-6 py-10">
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoaderCircle size={30} className="animate-spin text-[#079d98]" />
        </div>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="min-h-screen bg-[#f5f9f8] px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-600">
            <AlertCircle className="mb-2" size={22} />
            {error || "Review request not found."}
          </div>
        </div>
      </main>
    );
  }

  const currentStore = request.storeId;
  const proposed = request.proposedProfile;

  return (
    <main className="min-h-screen bg-[#f5f9f8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.push("/superadmin/dashboard/stores")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#536b72] transition hover:text-[#079d98]"
        >
          <ArrowLeft size={17} />
          Back to Stores
        </button>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#079d98]">
              <Store size={20} />
              <span className="text-sm font-semibold">
                Store Profile Verification
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#123d4a] sm:text-3xl">
              Review Store Changes
            </h1>

            <p className="mt-2 text-sm text-[#829397]">
              Compare the current store profile with the requested changes.
            </p>
          </div>

          <span className="w-fit rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold capitalize text-amber-700">
            {request.status}
          </span>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[#123d4a]">
                Store Information
              </h2>
              <p className="mt-1 text-xs text-[#829397]">
                Compare existing details with the requested information.
              </p>
            </div>

            {currentStore ? (
              <div className="space-y-3">
                <ComparisonDetail
                  label="Store Status"
                  currentValue={currentStore.isActive ? "Active" : "Inactive"}
                  proposedValue={
                    proposed.isActive === true
                      ? "Active"
                      : proposed.isActive === false
                        ? "Inactive"
                        : "Not provided"
                  }
                />

                <ComparisonDetail
                  label="Store Name"
                  currentValue={currentStore.name}
                  proposedValue={proposed.name}
                />

                <ComparisonDetail
                  label="Contact Number"
                  currentValue={currentStore.contactNumber}
                  proposedValue={proposed.contactNumber}
                />

                <ComparisonDetail
  label="Physical Store Address"
  currentValue={currentStore.address}
  proposedValue={proposed.address}
/>

                <ComparisonDetail
                  label="Address Link"
                  currentValue={currentStore.addressLink}
                  proposedValue={proposed.addressLink}
                />

                <ComparisonDetail
                  label="Store Timings"
                  currentValue={currentStore.timings}
                  proposedValue={proposed.timings}
                />

                <ComparisonDetail
                  label="Services"
                  currentValue={currentStore.services?.join(", ")}
                  proposedValue={proposed.services?.join(", ")}
                />
              </div>
            ) : (
              <p className="text-sm text-red-500">
                Current store information is unavailable.
              </p>
            )}
          </section>
        </div>

        {currentStore && (
          <section className="rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[#123d4a]">
                Weekly Store Timings
              </h2>
              <p className="mt-1 text-xs text-[#829397]">
                Compare the current schedule with the requested schedule.
              </p>
            </div>

            <div className="space-y-3">
              {(
                [
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ] as const
              ).map((day) => {
                const currentDay = currentStore.weeklyTimings?.[day];
                const proposedDay = proposed.weeklyTimings?.[day];

                const formatTiming = (
                  schedule:
                    | {
                        isClosed?: boolean;
                        openTime?: string;
                        closeTime?: string;
                      }
                    | undefined,
                ) => {
                  if (!schedule) return "Not provided";
                  if (schedule.isClosed) return "Closed";

                  return `${schedule.openTime || "—"} – ${schedule.closeTime || "—"}`;
                };

                return (
                  <ComparisonDetail
                    key={day}
                    label={day.charAt(0).toUpperCase() + day.slice(1)}
                    currentValue={formatTiming(currentDay)}
                    proposedValue={formatTiming(proposedDay)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {currentStore && (
          <section className="rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-[#123d4a]">
              Main Store Image
            </h2>
            <p className="mb-5 text-xs text-[#829397]">
              Compare the current store image with the requested image.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-[#829397]">
                  CURRENT IMAGE
                </p>

                {currentStore.image?.path ? (
                  <img
                    src={`${API_BASE_URL}${currentStore.image.path}`}
                    alt="Current store"
                    className="h-56 w-full rounded-xl border border-[#edf2f1] object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-xl bg-[#f5f9f8] text-sm text-[#829397]">
                    No current image
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-[#087d7b]">
                  REQUESTED IMAGE
                </p>

                {proposed.image?.path ? (
                  <img
                    src={
                      requestedMainImage ||
                      `${API_BASE_URL}${proposed.image.path}`
                    }
                    alt="Requested store"
                    className="h-56 w-full rounded-xl border border-[#b9e5df] object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-xl bg-[#f5f9f8] text-sm text-[#829397]">
                    No image provided
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {currentStore && (
          <section className="rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-[#123d4a]">
              Gallery Images
            </h2>
            <p className="mb-5 text-xs text-[#829397]">
              Compare the existing gallery with the requested gallery.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-semibold text-[#829397]">
                  CURRENT GALLERY
                </p>

                {currentStore.images?.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentStore.images.map((image, index) => (
                      <img
                        key={`${image.path}-${index}`}
                        src={`${API_BASE_URL}${image.path}`}
                        alt={`Current gallery ${index + 1}`}
                        className="h-36 w-full rounded-xl border border-[#edf2f1] object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#f5f9f8] p-6 text-center text-sm text-[#829397]">
                    No current gallery images
                  </p>
                )}
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold text-[#087d7b]">
                  REQUESTED GALLERY
                </p>

                {proposed.images?.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const currentPaths = new Set(
                        (currentStore.images || []).map((image) => image.path),
                      );

                      let newImageIndex = 0;

                      return proposed.images.map((image, index) => {
                        const alreadyExists = currentPaths.has(image.path);

                        const src = alreadyExists
                          ? `${API_BASE_URL}${image.path}`
                          : requestedGalleryImages[newImageIndex++];

                        return (
                          <div key={`${image.path}-${index}`}>
                            {src ? (
                              <img
                                src={src}
                                alt={`Requested gallery ${index + 1}`}
                                className="h-36 w-full rounded-xl border border-[#b9e5df] object-cover"
                              />
                            ) : (
                              <div className="flex h-36 items-center justify-center rounded-xl bg-[#f5f9f8] text-xs text-[#829397]">
                                Image unavailable
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#f5f9f8] p-6 text-center text-sm text-[#829397]">
                    No requested gallery images
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Final Review Status */}
        {request.status !== "pending" && (
          <section
            className={`rounded-2xl border p-6 shadow-sm ${
              request.status === "approved"
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-red-200 bg-red-50/60"
            }`}
          >
            <div className="flex items-start gap-3">
              {request.status === "approved" ? (
                <ShieldCheck size={24} className="mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle size={24} className="mt-0.5 text-red-600" />
              )}

              <div className="min-w-0">
                <h2
                  className={`text-lg font-bold ${
                    request.status === "approved"
                      ? "text-emerald-800"
                      : "text-red-800"
                  }`}
                >
                  Request {request.status}
                </h2>

                <p className="mt-1 text-sm text-[#536b72]">
                  {request.status === "approved"
                    ? "The requested store profile changes have been approved and applied."
                    : "The requested store profile changes were rejected. The existing approved profile remains unchanged."}
                </p>

                {request.reviewedAt && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-[#536b72]">
                    <CalendarDays size={15} />
                    Reviewed on:{" "}
                    {new Date(request.reviewedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}

                {request.status === "rejected" && request.rejectionReason && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-white/80 p-4">
                    <p className="mb-1 text-xs font-semibold text-red-700">
                      Rejection Reason
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-[#536b72]">
                      {request.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Review Actions */}
        {request.status === "pending" && (
          <section className="rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[#123d4a]">
                Review Decision
              </h2>
              <p className="mt-1 text-sm text-[#829397]">
                Verify the requested changes before making your decision.
              </p>
            </div>

            {actionError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={18} />
                {actionError}
              </div>
            )}

            {showRejectForm && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50/50 p-4">
                <label className="mb-2 block text-sm font-semibold text-[#123d4a]">
                  Reason for rejection
                </label>

                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Explain why this request is being rejected..."
                  className="w-full resize-none rounded-xl border border-[#dfe9e7] bg-white p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />

                <p className="mt-1 text-right text-xs text-[#829397]">
                  {rejectReason.length}/500 characters
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() => {
                  setActionError("");
                  setShowRejectForm((current) => !current);
                  setRejectReason("");
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 px-6 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <X size={17} />
                {showRejectForm ? "Cancel Rejection" : "Reject Request"}
              </button>

              {showRejectForm ? (
                <button
                  type="button"
                  disabled={actionLoading !== null || !rejectReason.trim()}
                  onClick={handleReject}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "reject" ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <X size={17} />
                  )}
                  Confirm Rejection
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={handleApprove}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#079d98] px-6 text-sm font-semibold text-white transition hover:bg-[#078b86] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === "approve" ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Check size={17} />
                  )}
                  Accept Request
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-[#edf2f1] pb-3 last:border-0">
      <p className="mb-1 text-xs font-medium text-[#829397]">{label}</p>
      <p className="break-words font-semibold text-[#123d4a]">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function ComparisonDetail({
  label,
  currentValue,
  proposedValue,
}: {
  label: string;
  currentValue?: string | null;
  proposedValue?: string | null;
}) {
  const current = currentValue?.trim() || "Not provided";
  const proposed = proposedValue?.trim() || "Not provided";
  const changed = current !== proposed;

  return (
    <div
      className={`rounded-xl border p-3 ${
        changed ? "border-[#b9e5df] bg-[#f0faf8]" : "border-[#edf2f1] bg-white"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[#829397]">{label}</p>

        {changed && (
          <span className="rounded-full bg-[#d9f3ed] px-2 py-1 text-[10px] font-semibold text-[#087d7b]">
            Changed
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#829397]">
            Current
          </p>
          <p className="break-words text-sm font-semibold text-[#123d4a]">
            {current}
          </p>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#829397]">
            Requested
          </p>
          <p
            className={`break-words text-sm font-semibold ${
              changed ? "text-[#087d7b]" : "text-[#123d4a]"
            }`}
          >
            {proposed}
          </p>
        </div>
      </div>
    </div>
  );
}
