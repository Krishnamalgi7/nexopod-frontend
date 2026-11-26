
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Store,
  Zap,
  CalendarClock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

type StoreService = "Phone Charging" | "Pick Me Later";

interface DayTiming {
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

interface StoreData {
  _id: string;
  name: string;
  services: StoreService[];
  weeklyTimings?: Record<string, DayTiming>;
  timings?: string;
}

interface ChargingSlot {
  slotNumber: number;
  isOccupied: boolean;
  isAvailable: boolean;
  bookedRanges: {
    startAt: string;
    serviceEndAt: string;
  }[];
}

function CreateBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const storeId = searchParams.get("storeId");
  const service = searchParams.get("service") as StoreService | null;

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [slots, setSlots] = useState<ChargingSlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(30);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedDate] = useState(() => new Date());

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const fetchStore = useCallback(async () => {
    if (!storeId) {
      setError("Store information is missing.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/public/stores/${storeId}`,
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load store details.");
      }

      setStore(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load store.");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const fetchAvailability = useCallback(async () => {
    if (!storeId || service !== "Phone Charging") return;

    setAvailabilityLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/public/stores/${storeId}/phone-charging/availability?date=${formatDate(selectedDate)}`,
        { cache: "no-store" },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load slot availability.");
      }

      setSlots(result.data.slots || []);
      setSelectedSlot((current) => {
        const stillAvailable = result.data.slots?.some(
          (slot: ChargingSlot) =>
            slot.slotNumber === current && slot.isAvailable,
        );
        return stillAvailable ? current : null;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load availability.",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }, [storeId, service, selectedDate]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const storeTiming = (() => {
    if (!store?.weeklyTimings) return "Store timings unavailable";

    const day = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    })
      .format(new Date())
      .toLowerCase();

    const timing = store.weeklyTimings[day];

    if (!timing || timing.isClosed) return "Closed today";

    return `${timing.openTime || "--"} – ${timing.closeTime || "--"}`;
  })();

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#F5F8FA]">
        <Loader2 className="h-7 w-7 animate-spin text-[#00BFA5]" />
      </main>
    );
  }

  if (error && !store) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center bg-[#F5F8FA] px-4">
        <div className="text-center">
          <p className="font-semibold text-[#142D46]">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm font-semibold text-[#00A98F]"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  if (!store || !service || !store.services?.includes(service)) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center bg-[#F5F8FA]">
        <div className="text-center">
          <p className="font-semibold text-[#142D46]">
            Booking details unavailable
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm font-semibold text-[#00A98F]"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F8FA] px-4 pb-28 pt-5 text-[#142D46] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-5 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={21} />
          </button>
          <h1 className="text-lg font-bold sm:text-xl">Create Booking</h1>
        </header>

        <div className="mx-auto w-full max-w-6xl space-y-5">
          <section className="flex items-center gap-4 rounded-2xl border border-[#E7EDF1] bg-white p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3] text-[#00BFA5]">
              <Store size={27} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-bold">{store.name}</h2>
              <p className="mt-1 text-sm text-[#7B8798]">{service}</p>
            </div>
          </section>

          {service === "Phone Charging" ? (
            <>
              <section className="rounded-2xl border border-[#E7EDF1] bg-white p-4 sm:p-5">
                <h2 className="font-bold">Select Date</h2>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#E7EDF1] p-4">
                  <CalendarDays className="shrink-0 text-[#00A98F]" />
                  <span className="text-sm font-semibold sm:text-base">
                    {formatDisplayDate(selectedDate)}
                  </span>
                </div>

                <h3 className="mt-5 font-bold">Store Timings</h3>
                <p className="mt-2 text-sm text-[#7B8798]">{storeTiming}</p>
                <p className="mt-2 text-xs text-[#7B8798]">
                  Phone Charging is available for today only.
                </p>
              </section>

              <section className="rounded-2xl border border-[#E7EDF1] bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold">Select Charging Slot</h2>
                  <button
                    onClick={fetchAvailability}
                    disabled={availabilityLoading}
                    className="text-xs font-semibold text-[#00A98F] disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#7B8798]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-[#00BFA5]" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-[#CBD5E1]" />
                    Occupied
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded border-2 border-[#00BFA5]" />
                    Selected
                  </span>
                </div>

                {availabilityLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-[#00BFA5]" />
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {slots.map((slot) => {
                      const selected = selectedSlot === slot.slotNumber;

                      return (
                        <button
                          key={slot.slotNumber}
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot.slotNumber)}
                          className={`rounded-xl border p-4 text-center transition ${
                            selected
                              ? "border-[#00BFA5] bg-[#E4F7F3] text-[#008F79]"
                              : slot.isOccupied
                                ? "cursor-not-allowed border-[#E7EDF1] bg-[#F1F5F9] text-[#94A3B8]"
                                : "border-[#E7EDF1] bg-white text-[#142D46] hover:border-[#00BFA5]"
                          }`}
                        >
                          <div className="text-sm font-bold">
                            Slot {slot.slotNumber}
                          </div>
                          <div className="mt-1 text-xs">
                            {selected
                              ? "Selected"
                              : slot.isOccupied
                                ? "Occupied"
                                : "Available"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!availabilityLoading && slots.length === 0 && !error && (
                  <p className="py-6 text-center text-sm text-[#7B8798]">
                    No charging slots are available.
                  </p>
                )}

                {error && (
                  <p className="mt-3 text-sm text-red-600">{error}</p>
                )}
              </section>

              <section className="rounded-2xl border border-[#E7EDF1] bg-white p-4 sm:p-5">
                <h2 className="font-bold">Select Charging Duration</h2>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setDuration(minutes)}
                      className={`rounded-xl border px-2 py-3 text-sm font-semibold ${
                        duration === minutes
                          ? "border-[#00BFA5] bg-[#E4F7F3] text-[#008F79]"
                          : "border-[#E7EDF1] bg-white text-[#142D46]"
                      }`}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#E7EDF1] bg-white p-4 sm:p-5">
                <h2 className="font-bold">Your Details</h2>
                <div className="mt-4 space-y-3">
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Enter your name"
                    maxLength={100}
                    className="w-full rounded-xl border border-[#E7EDF1] bg-white px-4 py-3 text-sm outline-none focus:border-[#00BFA5]"
                  />
                  <input
                    value={customerPhone}
                    onChange={(event) =>
                      setCustomerPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full rounded-xl border border-[#E7EDF1] bg-white px-4 py-3 text-sm outline-none focus:border-[#00BFA5]"
                  />
                </div>
              </section>

              <button
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00BFA5] px-5 py-4 font-bold text-white opacity-60"
              >
                Confirm Booking
              </button>
              <p className="text-center text-xs text-[#7B8798]">
                Charging starts immediately after booking confirmation.
              </p>
            </>
          ) : (
            <section className="rounded-2xl border border-[#E7EDF1] bg-white p-5">
              <div className="flex items-center gap-3">
                <CalendarClock className="text-[#00BFA5]" size={25} />
                <h2 className="font-bold">Pick Me Later</h2>
              </div>
              <p className="mt-3 text-sm text-[#7B8798]">
                We'll build the storage and collection-time selection here.
                Booking submission will be connected after we finalize the
                Pick Me Later backend.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CreateBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F8FA]">
          Loading booking details...
        </div>
      }
    >
      <CreateBookingContent />
    </Suspense>
  );
}
