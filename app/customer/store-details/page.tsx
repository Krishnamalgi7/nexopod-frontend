
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  Zap,
  CalendarClock,
  CircleCheck,
  Circle,
  X,
  LoaderCircle,
} from "lucide-react";
import API_BASE_URL from "@/services/common/api";
import ImageWithFallback from "@/components/common/ImageWithFallback";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface DayTiming {
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

interface StoreImage {
  path?: string;
  url?: string;
  uri?: string;
  secure_url?: string;
}

interface StoreItem {
  _id: string;
  name: string;
  address?: string;
  addressLink?: string;
  timings?: string;
  weeklyTimings?: Record<string, DayTiming>;
  services: string[];
  image?: string | StoreImage;
  images?: (string | StoreImage)[];
}

const getImageUrl = (
  image?: string | StoreImage,
): string | undefined => {
  if (typeof image === "string") {
    return image.startsWith("http")
      ? image
      : `${API_BASE_URL}${image}`;
  }

  if (image && typeof image === "object") {
    const path =
      image.path || image.url || image.uri || image.secure_url;

    if (path) {
      return path.startsWith("http")
        ? path
        : `${API_BASE_URL}${path}`;
    }
  }

  return undefined;
};

function StoreDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const storeId = searchParams.get("storeId");
  const initialService = searchParams.get("service");

  const [store, setStore] = useState<StoreItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState(0);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(
    initialService,
  );

  useEffect(() => {
    if (!storeId) {
      setError("Store information is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchStore = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/public/stores/${storeId}`,
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load store details.");
        }

        if (!cancelled) {
          setStore(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load store details.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStore();

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const storeImages = store
    ? [store.image, ...(store.images || [])]
        .map(getImageUrl)
        .filter((uri): uri is string => Boolean(uri))
        .filter((uri, index, array) => array.indexOf(uri) === index)
    : [];

  const goToPreviousImage = () => {
    setActiveImage((current) => Math.max(0, current - 1));
  };

  const goToNextImage = () => {
    setActiveImage((current) =>
      Math.min(storeImages.length - 1, current + 1),
    );
  };

  const handleContinue = () => {
    if (!selectedService || !storeId) return;

    router.push(
      `/customer/create-booking?storeId=${encodeURIComponent(
        storeId,
      )}&service=${encodeURIComponent(selectedService)}`,
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F8FA]">
        <div className="text-center">
          <LoaderCircle
            size={36}
            className="mx-auto animate-spin text-[#00BFA5]"
          />
          <p className="mt-3 text-sm text-[#7B8798]">
            Loading store details...
          </p>
        </div>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F5F8FA] px-5 text-center">
        <h2 className="text-xl font-bold text-[#142D46]">
          {error || "Store not found"}
        </h2>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-5 rounded-full bg-[#00BFA5] px-6 py-3 font-semibold text-white"
        >
          Go Back
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F8FA] px-4 pb-10 pt-3 text-[#142D46] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">

        {/* Header */}
        <header className="flex items-center gap-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft size={21} />
          </button>

          <h1 className="text-lg font-bold sm:text-xl">
            Store Details
          </h1>
        </header>

        {/* Store Image Carousel */}
        <section className="mt-4">
          <div className="relative mx-auto h-[190px] w-fit max-w-full overflow-hidden rounded-3xl sm:h-[230px]">
            {storeImages.length > 0 ? (
              <ImageWithFallback
                key={storeImages[activeImage]}
                src={storeImages[activeImage]}
                alt={`${store.name} image ${activeImage + 1}`}
                className="h-full w-auto max-w-full object-contain"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <ImageIcon size={44} className="text-[#00BFA5]" />
                <p className="mt-2 text-sm text-[#7B8798]">
                  No store images available
                </p>
              </div>
            )}

            {activeImage > 0 && (
              <button
                type="button"
                onClick={goToPreviousImage}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <ChevronLeft size={27} />
              </button>
            )}

            {activeImage < storeImages.length - 1 && (
              <button
                type="button"
                onClick={goToNextImage}
                aria-label="Next image"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <ChevronRight size={27} />
              </button>
            )}

            {storeImages.length > 0 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white">
                {activeImage + 1} / {storeImages.length}
              </span>
            )}
          </div>

          {storeImages.length > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {storeImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Show image ${index + 1}`}
                  onClick={() => setActiveImage(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    activeImage === index
                      ? "w-11 bg-[#00BFA5]"
                      : "w-2.5 bg-[#C9D6D8]"
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Store Information */}
        <section className="mt-7">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {store.name}
          </h2>

          {/* Store Address */}
          {store.address && (
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3] text-[#00A889]">
                <MapPin size={19} />
              </div>

              <p className="pt-1 text-sm leading-6 text-[#7B8798]">
                {store.address}
              </p>
            </div>
          )}

          {/* Store Location */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3] text-[#00A889]">
              <MapPin size={19} />
            </div>

            <button
              type="button"
              disabled={!store.addressLink}
              onClick={() => {
                if (store.addressLink) {
                  window.open(
                    store.addressLink,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }
              }}
              className="flex items-center gap-2 rounded-full bg-[#E4F7F3] px-5 py-3 text-sm font-semibold text-[#008F75] disabled:opacity-50"
            >
              View Store Location
              <ExternalLink size={17} />
            </button>
          </div>

          {/* Weekly Schedule */}
          <div className="mt-3 flex items-center gap-3 border-b border-[#E7EDF1] pb-5">
            <div className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3] text-[#00A889]">
              <Clock size={19} />
            </div>

            <button
              type="button"
              onClick={() => setScheduleVisible(true)}
              className="rounded-full bg-[#E4F7F3] px-5 py-3 text-sm font-semibold text-[#008F75]"
            >
              See weekly schedule
            </button>
          </div>
        </section>

        {/* Choose a Service */}
        <section className="mt-8">
          <h2 className="text-xl font-bold sm:text-2xl">
            Choose a Service
          </h2>

          <p className="mt-1 text-sm text-[#7B8798] sm:text-base">
            Select one service to continue
          </p>

          <div className="mt-5 space-y-4">
            {store.services?.map((item) => {
              const isSelected = selectedService === item;
              const isPhoneCharging = item === "Phone Charging";

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedService(item)}
                  className={`w-full rounded-[22px] border bg-white p-5 text-left transition ${
                    isSelected
                      ? "border-2 border-[#00BFA5]"
                      : "border border-[#E7EDF1]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#E4F7F3] text-[#00BFA5]">
                      {isPhoneCharging ? (
                        <Zap size={39} />
                      ) : (
                        <CalendarClock size={39} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-[#171717] sm:text-lg">
                        {item}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-[#7B8798] sm:text-base">
                        {isPhoneCharging
                          ? "Charge your phone while you relax"
                          : "Store now and collect later"}
                      </p>
                    </div>

                    {isSelected ? (
                      <CircleCheck
                        size={27}
                        className="shrink-0 text-[#00BFA5]"
                      />
                    ) : (
                      <Circle
                        size={27}
                        className="shrink-0 text-[#7B8798]"
                      />
                    )}
                  </div>

                  {isSelected && (
                    <span className="mt-3 inline-block rounded-full bg-[#DDF5E8] px-3 py-1 text-xs font-semibold text-[#008F45]">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedService}
            className={`mt-6 h-16 w-full rounded-2xl text-lg font-bold text-white transition ${
              selectedService
                ? "bg-[#00A995] hover:bg-[#009D89]"
                : "cursor-not-allowed bg-[#A9CFC9]"
            }`}
          >
            Continue →
          </button>

          <p className="mt-4 text-center text-sm text-[#7B8798]">
            You can select only one service at a time
          </p>
        </section>
      </div>

      {/* Weekly Schedule Modal */}
      {scheduleVisible && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setScheduleVisible(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="weekly-schedule-title"
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="weekly-schedule-title"
                  className="text-xl font-bold text-[#142D46]"
                >
                  Weekly Schedule
                </h2>
                <p className="mt-1 text-sm text-[#7B8798]">
                  Store operating hours
                </p>
              </div>

              <button
                type="button"
                onClick={() => setScheduleVisible(false)}
                aria-label="Close schedule"
                className="rounded-full bg-[#F5F8FA] p-2 text-[#7B8798]"
              >
                <X size={20} />
              </button>
            </div>

            {DAYS.map((day) => {
              const timing = store.weeklyTimings?.[day.toLowerCase()];

              return (
                <div
                  key={day}
                  className="flex items-center justify-between gap-4 border-b border-[#E7EDF1] py-4 last:border-0"
                >
                  <span className="font-semibold text-[#142D46]">
                    {day}
                  </span>

                  <span className="text-right text-sm text-[#7B8798]">
                    {!timing
                      ? "Not specified"
                      : timing.isClosed
                        ? "Closed"
                        : `${timing.openTime} - ${timing.closeTime}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

export default function StoreDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F8FA]">
          Loading store details...
        </div>
      }
    >
      <StoreDetailsContent />
    </Suspense>
  );
}
