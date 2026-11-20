"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Store, AlertCircle } from "lucide-react";

import {
  getStoreProfileReview,
  type StoreProfileReviewRequest,
} from "@/services/storeProfileReviewService";

import ImageWithFallback from "@/components/ImageWithFallback";
import API_BASE_URL from "@/services/api";
import { getPendingStoreProfileImage } from "@/services/storeProfileReviewService";

export default function StoreProfileReviewPage() {
  const params = useParams<{ requestId: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<StoreProfileReviewRequest | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <button
            type="button"
            onClick={() => router.push("/dashboard/stores")}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#536b72] hover:text-[#079d98]"
          >
            <ArrowLeft size={17} />
            Back to Stores
          </button>

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
          onClick={() => router.push("/dashboard/stores")}
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Store Profile */}
          <section className="rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-[#123d4a]">
              Current Store Information
            </h2>

            {currentStore ? (
              <div className="space-y-4 text-sm">
                <Detail label="Store Name" value={currentStore.name} />
                <Detail
                  label="Contact Number"
                  value={currentStore.contactNumber}
                />
                <Detail label="Address Link" value={currentStore.addressLink} />
                <Detail
                  label="Store Status"
                  value={currentStore.isActive ? "Active" : "Inactive"}
                />
              </div>
            ) : (
              <p className="text-sm text-red-500">
                Current store information is unavailable.
              </p>
            )}
          </section>

          {/* Requested Store Profile */}
          <section className="rounded-2xl border border-[#b9e5df] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-[#087d7b]">
              Requested Changes
            </h2>

            <div className="space-y-4 text-sm">
              <Detail label="Store Name" value={proposed.name} />
              <Detail label="Contact Number" value={proposed.contactNumber} />
              <Detail label="Address Link" value={proposed.addressLink} />
              <Detail label="Store Timings" value={proposed.timings} />
              <Detail label="Services" value={proposed.services?.join(", ")} />
            </div>
          </section>
        </div>
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
