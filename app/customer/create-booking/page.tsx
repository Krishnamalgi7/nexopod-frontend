"use client";
import { jsPDF } from "jspdf";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Store,
  Zap,
  CalendarClock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Download,
  Clock3,
  ChevronLeft,
  ChevronRight,
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

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function CustomTimePicker({ label, value, onChange }: TimePickerProps) {
  const [hourValue, minuteValue] = value
    ? value.split(":").map(Number)
    : [0, 0];

  const period = hourValue >= 12 ? "PM" : "AM";
  const hour12 = hourValue % 12 || 12;

  const updateTime = (
    hour: number,
    minute: number,
    selectedPeriod: "AM" | "PM",
  ) => {
    const normalizedHour = (hour % 12) + (selectedPeriod === "PM" ? 12 : 0);

    onChange(
      `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
  };

  const selectClass =
    "h-10 rounded-xl border border-[#DCEFEA] bg-[#E4F7F3] px-3 text-lg font-bold text-[#00A98F] outline-none focus:border-[#00BFA5]";

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#142D46]">
        {label}
      </label>

      <div className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl border border-[#E7EDF1] bg-white px-3 py-2 transition focus-within:border-[#00BFA5] sm:gap-3">
        <select
          value={hour12}
          onChange={(e) =>
            updateTime(Number(e.target.value), minuteValue, period)
          }
          aria-label={`${label} hour`}
          className={`${selectClass} w-[76px]`}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
            <option key={hour} value={hour}>
              {String(hour).padStart(2, "0")}
            </option>
          ))}
        </select>

        <span className="text-xl font-bold text-[#142D46]">:</span>

        <select
          value={minuteValue}
          onChange={(e) => updateTime(hour12, Number(e.target.value), period)}
          aria-label={`${label} minute`}
          className={`${selectClass} w-[76px]`}
        >
          {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
            <option key={minute} value={minute}>
              {String(minute).padStart(2, "0")}
            </option>
          ))}
        </select>

        <div className="ml-1 flex items-center gap-1.5">
          {(["AM", "PM"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => updateTime(hour12, minuteValue, item)}
              className={`h-10 rounded-xl border px-3 text-sm font-semibold transition ${
                period === item
                  ? "border-[#00BFA5] bg-[#00BFA5] text-white"
                  : "border-[#E7EDF1] bg-white text-[#64748B] hover:border-[#00BFA5]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
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
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(30);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [collectionTime, setCollectionTime] = useState("");
  const [collectionDate, setCollectionDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [assignPicker, setAssignPicker] = useState(false);
  const [pickerName, setPickerName] = useState("");
  const [pickerPhone, setPickerPhone] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);

  const [selectedDate] = useState(() => new Date());

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = formatDate(new Date(currentTime));

  const calendarDays = (() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: totalDays }, (_, index) => {
        const date = new Date(year, month, index + 1);
        const dateKey = formatDate(date);
        const weekday = date
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();
        const timing = store?.weeklyTimings?.[weekday];

        return {
          day: index + 1,
          dateKey,
          isPast: dateKey < todayDate,
          isClosed: timing?.isClosed === true,
        };
      }),
    ];
  })();

  const currentStorageTime = new Date(currentTime).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

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

  const fetchAvailability = useCallback(
    async (silent = false) => {
      if (!storeId || service !== "Phone Charging") return;

      if (!silent) setAvailabilityLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/stores/${storeId}/phone-charging/availability?date=${formatDate(selectedDate)}`,
          { cache: "no-store" },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load slot availability.",
          );
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
        if (!silent) setAvailabilityLoading(false);
      }
    },
    [storeId, service, selectedDate],
  );

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    if (service !== "Phone Charging" || !storeId) return;

    const interval = setInterval(() => {
      fetchAvailability(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [service, storeId, fetchAvailability]);

  // currently not in use
  const downloadBookingPDF = () => {
    if (!confirmedBooking) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(0, 143, 121);
    doc.text("NexoPod", 20, 25);

    doc.setFontSize(16);
    doc.setTextColor(20, 45, 70);
    doc.text("Booking Confirmation", 20, 40);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);

    const details = [
      `Booking Reference: ${confirmedBooking.bookingReference || "Not available"}`,
      `Store: ${store?.name || "NexoPod Store"}`,
      `Service: ${service || "N/A"}`,
      `Customer Name: ${confirmedBooking.customerName || customerName}`,
      `Phone Number: ${confirmedBooking.customerPhone || customerPhone}`,
    ];

    if (service === "Phone Charging") {
      details.push(
        `Charging Slot: ${confirmedBooking.slotNumber}`,
        `Duration: ${confirmedBooking.durationMinutes} minutes`,
      );
    }

    if (service === "Pick Me Later") {
      details.push(
        `Item: ${itemName}`,
        `Quantity: ${itemQuantity}`,
        `Storage Time: ${currentStorageTime}`,
        `Collection Date: ${collectionDate}`,
        `Collection Time: ${collectionTime}`,
        `Collection Method: ${assignPicker ? "Assigned Picker" : "Self Collection"}`,
      );
    }

    details.forEach((detail, index) => {
      doc.text(detail, 20, 60 + index * 10);
    });

    doc.setFontSize(9);
    doc.text(
      "Thank you for choosing NexoPod!",
      20,
      60 + details.length * 10 + 15,
    );

    doc.save(
      `NexoPod-Booking-${confirmedBooking.bookingReference || confirmedBooking._id}.pdf`,
    );
  };

  const handleConfirmBooking = async () => {
    if (!storeId || !selectedSlot) {
      setError("Please select an available charging slot.");
      return;
    }

    if (customerName.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (!/^\d{10}$/.test(customerPhone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/phone-charging`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeId,
            slotNumber: selectedSlot,
            durationMinutes: duration,
            customerName: customerName.trim(),
            customerPhone,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Booking unsuccessful.");
      }

      setConfirmedBooking({
        ...result.data,
        slotNumber: selectedSlot,
        durationMinutes: duration,
      });
      setShowBookingConfirmation(true);

      await fetchAvailability(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking unsuccessful.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickMeLaterBooking = async () => {
    if (!storeId) {
      setError("Store information is missing.");
      return;
    }

    if (customerName.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (!/^\d{10}$/.test(customerPhone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!collectionDate || !collectionTime) {
      setError("Please select collection date and time.");
      return;
    }

    if (itemName.trim().length < 2) {
      setError("Please enter the item name.");
      return;
    }

    const quantity = Number(itemQuantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      setError("Please enter a valid item quantity.");
      return;
    }

    if (assignPicker) {
      if (pickerName.trim().length < 2) {
        setError("Please enter the picker's name.");
        return;
      }

      if (!/^\d{10}$/.test(pickerPhone)) {
        setError("Please enter a valid 10-digit picker phone number.");
        return;
      }
    }

    const startAt = new Date(currentTime);

    const endAt = new Date(`${collectionDate}T${collectionTime}:00+05:30`);

    const collectionDay = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    })
      .format(new Date(`${collectionDate}T12:00:00+05:30`))
      .toLowerCase();

    const dayTiming = store?.weeklyTimings?.[collectionDay];

    if (!dayTiming) {
      setError("Store timings are unavailable for the selected date.");
      return;
    }

    if (dayTiming.isClosed) {
      setError("The store is closed on the selected collection date.");
      return;
    }

    if (!dayTiming.openTime || !dayTiming.closeTime) {
      setError("Store operating hours are not configured for this date.");
      return;
    }

    if (
      collectionTime < dayTiming.openTime ||
      collectionTime > dayTiming.closeTime
    ) {
      setError(
        `Please select a collection time between ${dayTiming.openTime} and ${dayTiming.closeTime}.`,
      );
      return;
    }

    if (endAt <= startAt) {
      setError("Collection time must be after storage time.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/pick-me-later`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeId,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            customerName: customerName.trim(),
            customerPhone,
            itemName: itemName.trim(),
            itemQuantity: quantity,
            assignPicker,
            pickerName: assignPicker ? pickerName.trim() : "",
            pickerPhone: assignPicker ? pickerPhone : "",
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Booking unsuccessful.");
      }

      setConfirmedBooking(result.data);
      setShowBookingConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking unsuccessful.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSlotCountdown = (slot: ChargingSlot) => {
    const nextEndTime = slot.bookedRanges
      .map((range) => new Date(range.serviceEndAt).getTime())
      .filter((endTime) => endTime > currentTime)
      .sort((a, b) => a - b)[0];

    if (!nextEndTime) return null;

    const remainingSeconds = Math.ceil((nextEndTime - currentTime) / 1000);

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

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
                    onClick={() => fetchAvailability()}
                    disabled={availabilityLoading}
                    aria-label="Refresh availability"
                    title="Refresh availability"
                    className="rounded-lg p-2 text-[#00A98F] transition hover:bg-[#E4F7F3] disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      size={17}
                      className={availabilityLoading ? "animate-spin" : ""}
                    />
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

                          {slot.isOccupied && getSlotCountdown(slot) && (
                            <div className="mt-2 flex items-center justify-center gap-2">
                              <span className="text-xs font-medium text-[#7B8798]">
                                Slot opens in
                              </span>
                              <span className="text-sm font-bold tabular-nums text-[#D97706]">
                                {getSlotCountdown(slot)}
                              </span>
                            </div>
                          )}
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

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
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
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#142D46]">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Enter your name"
                      maxLength={100}
                      className="w-full rounded-xl border border-[#E7EDF1] bg-white px-4 py-3 text-sm outline-none focus:border-[#00BFA5]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#142D46]">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex w-full overflow-hidden rounded-xl border border-[#E7EDF1] bg-white focus-within:border-[#00BFA5]">
                      <span className="flex items-center border-r border-[#E7EDF1] bg-[#F5F8FA] px-4 text-sm font-semibold text-[#142D46]">
                        +91
                      </span>

                      <input
                        value={customerPhone}
                        onChange={(event) =>
                          setCustomerPhone(
                            event.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder="10-digit mobile number"
                        inputMode="numeric"
                        maxLength={10}
                        className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={
                  submitting ||
                  availabilityLoading ||
                  !selectedSlot ||
                  customerName.trim().length < 2 ||
                  customerPhone.length !== 10
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00BFA5] px-5 py-4 font-bold text-white transition hover:bg-[#00A98F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>

              <p className="text-center text-xs text-[#7B8798]">
                Charging starts immediately after booking confirmation.
              </p>
            </>
          ) : (
            <section className="space-y-5 rounded-2xl border border-[#E7EDF1] bg-white p-5">
              <div className="flex items-center gap-3">
                <CalendarClock className="text-[#00BFA5]" size={25} />
                <div>
                  <h2 className="font-bold text-[#142D46]">Pick Me Later</h2>
                  <p className="text-xs text-[#7B8798]">
                    Store your item and collect it later.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_1fr] sm:gap-x-5">
                <div className="order-1 sm:col-start-1 sm:row-start-1">
                  <label className="mb-2 block text-sm font-semibold text-[#142D46]">
                    Storage time
                  </label>
                  <div className="flex min-h-[62px] items-center gap-3 rounded-xl border border-[#DCEFEA] bg-[#E4F7F3] px-4">
                    <Clock3 size={20} className="text-[#00A98F]" />
                    <span className="text-lg font-bold text-[#00A98F]">
                      {currentStorageTime}
                    </span>
                    <span className="ml-auto text-xs text-[#7B8798]">
                      Current time
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#142D46]">
                    Collection date
                  </label>

                  <div className="rounded-xl border border-[#E7EDF1] bg-white p-3 shadow-sm">
                    {/* Calendar header */}
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-[#142D46]">
                          {calendarMonth.toLocaleDateString("en-IN", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-0.5 text-xs text-[#7B8798]">
                          Select your collection date
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={
                            calendarMonth.getMonth() ===
                              new Date(currentTime).getMonth() &&
                            calendarMonth.getFullYear() ===
                              new Date(currentTime).getFullYear()
                          }
                          onClick={() =>
                            setCalendarMonth(
                              new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() - 1,
                                1,
                              ),
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7EDF1] text-[#142D46] transition hover:bg-[#E4F7F3] disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Previous month"
                        >
                          <ChevronLeft size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setCalendarMonth(
                              new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() + 1,
                                1,
                              ),
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7EDF1] text-[#142D46] transition hover:bg-[#E4F7F3]"
                          aria-label="Next month"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Weekday labels */}
                    <div className="mb-1 grid grid-cols-7">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="py-1 text-center text-xs font-semibold text-[#7B8798]"
                          >
                            {day}
                          </div>
                        ),
                      )}
                    </div>

                    {/* Calendar dates */}
                    <div className="grid grid-cols-7 gap-y-0">
                      {calendarDays.map((date, index) => {
                        if (!date) {
                          return <div key={`empty-${index}`} />;
                        }

                        const isSelected = collectionDate === date.dateKey;
                        const isToday = date.dateKey === todayDate;
                        const isDisabled = date.isPast || date.isClosed;

                        return (
                          <button
                            key={date.dateKey}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setCollectionDate(date.dateKey)}
                            className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold transition
              ${
                isSelected
                  ? "bg-[#00BFA5] text-white shadow-md shadow-[#00BFA5]/25"
                  : isDisabled
                    ? "cursor-not-allowed text-[#C5CDD4]"
                    : "text-[#142D46] hover:bg-[#E4F7F3]"
              }`}
                            title={
                              date.isClosed
                                ? "Store is closed"
                                : date.isPast
                                  ? "Past date unavailable"
                                  : "Select collection date"
                            }
                          >
                            {date.day}

                            {isToday && !isSelected && (
                              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#00BFA5]" />
                            )}

                            {date.isClosed && !date.isPast && (
                              <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[#E58A72]" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#00BFA5]" />
                        <span className="text-[11px] text-[#7B8798]">
                          Selected
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#E58A72]" />
                        <span className="text-[11px] text-[#7B8798]">
                          Store closed
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#C5CDD4]" />
                        <span className="text-[11px] text-[#7B8798]">
                          Unavailable
                        </span>
                      </div>
                    </div>

                    {/* Selected date */}
                    <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 bg-[#E4F7F3] px-3 py-2.5">
                      <CalendarDays size={17} className="text-[#00A98F]" />
                      <span className="text-sm font-semibold text-[#164653]">
                        {new Date(
                          `${collectionDate}T12:00:00`,
                        ).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-[#7B8798]">
                    Only dates when the store is open can be selected.
                  </p>
                </div>

                <div className="order-3 min-w-0 sm:col-start-1 sm:row-start-2">
                  <CustomTimePicker
                    label="Collection time"
                    value={collectionTime}
                    onChange={setCollectionTime}
                  />
                </div>
              </div>

              <div className="border-t border-[#E7EDF1] pt-4">
                <h3 className="mb-3 text-sm font-bold text-[#142D46]">
                  Your details
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#142D46]">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Your full name"
                      maxLength={100}
                      className="w-full rounded-xl border border-[#E7EDF1] px-4 py-3 text-sm outline-none focus:border-[#00BFA5]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#142D46]">
                      Phone Number <span className="text-red-500">*</span>
                    </label>

                    <div className="flex w-full overflow-hidden rounded-xl border border-[#E7EDF1] bg-white focus-within:border-[#00BFA5]">
                      <span className="flex items-center border-r border-[#E7EDF1] bg-[#F5F8FA] px-4 text-sm font-semibold text-[#142D46]">
                        +91
                      </span>

                      <input
                        value={customerPhone}
                        onChange={(event) =>
                          setCustomerPhone(
                            event.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder="10-digit mobile number"
                        inputMode="numeric"
                        maxLength={10}
                        className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E7EDF1] pt-4">
                <h3 className="mb-3 text-sm font-bold text-[#142D46]">
                  Item details
                </h3>

                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <input
                    value={itemName}
                    onChange={(event) => setItemName(event.target.value)}
                    placeholder="Enter item name"
                    maxLength={100}
                    className="w-full rounded-xl border border-[#E7EDF1] px-4 py-3 text-sm outline-none focus:border-[#00BFA5]"
                  />

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={itemQuantity}
                    onChange={(event) => setItemQuantity(event.target.value)}
                    placeholder="Quantity"
                    className="w-full rounded-xl border border-[#E7EDF1] px-4 py-3 text-sm outline-none focus:border-[#00BFA5]"
                  />
                </div>
              </div>

              <div className="border-t border-[#E7EDF1] pt-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={assignPicker}
                    onChange={(event) => {
                      setAssignPicker(event.target.checked);
                      if (!event.target.checked) {
                        setPickerName("");
                        setPickerPhone("");
                      }
                    }}
                    className="h-4 w-4 accent-[#00BFA5]"
                  />
                  <span className="text-sm font-semibold text-[#142D46]">
                    Assign someone else to collect this item
                  </span>
                </label>

                {assignPicker && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <input
                      value={pickerName}
                      onChange={(event) => setPickerName(event.target.value)}
                      placeholder="Picker's full name"
                      maxLength={100}
                      className="w-full rounded-xl border border-[#E7EDF1] px-4 py-3 text-sm outline-none focus:border-[#00BFA5]"
                    />

                    <div className="flex w-full overflow-hidden rounded-xl border border-[#E7EDF1] bg-white focus-within:border-[#00BFA5]">
                      <span className="flex items-center border-r border-[#E7EDF1] bg-[#F5F8FA] px-4 text-sm font-semibold text-[#142D46]">
                        +91
                      </span>

                      <input
                        value={pickerPhone}
                        onChange={(event) =>
                          setPickerPhone(
                            event.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder="10-digit mobile number"
                        inputMode="numeric"
                        maxLength={10}
                        className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={handlePickMeLaterBooking}
                disabled={
                  submitting ||
                  customerName.trim().length < 2 ||
                  !/^\d{10}$/.test(customerPhone) ||
                  !collectionDate ||
                  !collectionTime ||
                  itemName.trim().length < 2 ||
                  !Number.isInteger(Number(itemQuantity)) ||
                  Number(itemQuantity) < 1 ||
                  Number(itemQuantity) > 100 ||
                  (assignPicker &&
                    (pickerName.trim().length < 2 ||
                      !/^\d{10}$/.test(pickerPhone)))
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00BFA5] px-6 py-3.5 font-semibold text-white transition hover:bg-[#00A890] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </section>
          )}
          {confirmedBooking && (
            <section className="mt-5 rounded-2xl border border-[#BCEDE2] bg-[#E4F7F3] p-5">
              <h2 className="font-bold text-[#087F6B]">Booking Confirmed</h2>

              <p>
                Booking Reference:{" "}
                <span>
                  {confirmedBooking.bookingReference || "Not available"}
                </span>
              </p>

              <p className="mt-2 text-sm text-[#142D46]">
                Customer: {confirmedBooking.customerName || customerName}
              </p>

              <p className="mt-1 text-sm text-[#142D46]">
                Phone: {confirmedBooking.customerPhone || customerPhone}
              </p>
              {service === "Phone Charging" && (
                <>
                  <p className="mt-2 text-sm text-[#142D46]">
                    Charging Slot: {confirmedBooking.slotNumber}
                  </p>

                  <p className="mt-1 text-sm text-[#142D46]">
                    Duration: {confirmedBooking.durationMinutes} minutes
                  </p>
                </>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Booking Confirmation popup */}
      {showBookingConfirmation && confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E4F7F3]">
              <CheckCircle2 size={30} className="text-[#00BFA5]" />
            </div>

            <h2 className="mt-4 text-center text-xl font-bold text-[#142D46]">
              Booking Confirmed!
            </h2>

            {service === "Phone Charging" ? (
              <>
                <p className="mt-3 text-center text-sm leading-6 text-[#7B8798]">
                  Your phone charging booking has been confirmed successfully.
                </p>

                <div className="mt-5 rounded-2xl border border-[#BCEDE2] bg-[#E4F7F3] p-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
                    <Zap size={25} className="text-[#00A98F]" />
                  </div>

                  <p className="text-base font-bold text-[#087F6B]">
                    Please hand over your phone to the shop owner.
                  </p>

                  <div className="mt-4 border-t border-[#BCEDE2] pt-3">
                    <p className="text-xs font-medium text-[#526579]">
                      Booking Reference
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#142D46]">
                      {confirmedBooking.bookingReference || "Not available"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBookingConfirmation(false)}
                  className="mt-5 w-full rounded-xl bg-[#00BFA5] px-5 py-3 font-semibold text-white transition hover:bg-[#00A890]"
                >
                  Got it
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-center text-sm text-[#7B8798]">
                  Your booking has been successfully confirmed.
                </p>

                <div className="mt-5 rounded-xl bg-[#F5F8FA] p-4">
                  <p className="text-xs font-medium text-[#7B8798]">
                    Booking Reference
                  </p>
                  <p className="mt-1 break-all text-sm font-bold text-[#142D46]">
                    {confirmedBooking.bookingReference || "Not available"}
                  </p>
                </div>

                <p className="mt-5 text-center text-sm text-[#7B8798]">
                  Would you like to download your booking confirmation?
                </p>

                <button
                  type="button"
                  onClick={downloadBookingPDF}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00BFA5] px-5 py-3 font-semibold text-white transition hover:bg-[#00A890]"
                >
                  <Download size={18} />
                  Download PDF
                </button>

                <button
                  type="button"
                  onClick={() => setShowBookingConfirmation(false)}
                  className="mt-3 w-full rounded-xl border border-[#E7EDF1] px-5 py-3 font-semibold text-[#142D46] transition hover:bg-[#F5F8FA]"
                >
                  Not Now
                </button>
              </>
            )}
          </div>
        </div>
      )}
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
