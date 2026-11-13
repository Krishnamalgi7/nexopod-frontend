"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  MapPin,
  Phone,
  Store,
  Upload,
  X,
  LoaderCircle,
  CheckCircle2,
  Plus,
  Clock,
  CalendarDays,
  Copy,
  Zap,
  Package,
  Layers,
} from "lucide-react";

import { createStore } from "@/services/storeService";
import ImageWithFallback from "@/components/ImageWithFallback";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DayTiming = {
  isClosed: boolean;
  openTime: string;
  closeTime: string;
};

const DAYS: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_WEEKLY_TIMINGS: Record<DayKey, DayTiming> = {
  monday: { isClosed: false, openTime: "10:00", closeTime: "21:00" },
  tuesday: { isClosed: false, openTime: "10:00", closeTime: "21:00" },
  wednesday: { isClosed: false, openTime: "10:00", closeTime: "21:00" },
  thursday: { isClosed: false, openTime: "10:00", closeTime: "21:00" },
  friday: { isClosed: false, openTime: "10:00", closeTime: "22:00" },
  saturday: { isClosed: false, openTime: "10:00", closeTime: "22:00" },
  sunday: { isClosed: false, openTime: "11:00", closeTime: "20:00" },
};

export default function AddStorePage() {
  const router = useRouter();

  const mainImageRef = useRef<HTMLInputElement>(null);
  const additionalImagesRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [addressLink, setAddressLink] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [services, setServices] = useState<string[]>([]);

  const [weeklyTimings, setWeeklyTimings] = useState<Record<DayKey, DayTiming>>(
    DEFAULT_WEEKLY_TIMINGS,
  );

  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("21:00");

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);

  const [mainPreview, setMainPreview] = useState("");
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Release preview URLs when files change or component unmounts.
  useEffect(() => {
    return () => {
      if (mainPreview) URL.revokeObjectURL(mainPreview);
      additionalPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mainPreview, additionalPreviews]);

  const validateImage = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, PNG and WEBP images are allowed.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Each image must be smaller than 5 MB.";
    }

    return "";
  };

  const handleMainImage = (file?: File) => {
    if (!file) return;

    const validationError = validateImage(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setMainImage(file);
    setMainPreview(URL.createObjectURL(file));
  };

  const handleAdditionalImages = (files: FileList | null) => {
    if (!files) return;

    setError("");

    const selectedFiles = Array.from(files);

    if (additionalImages.length + selectedFiles.length > 4) {
      setError("You can upload a maximum of 4 additional images.");
      return;
    }

    const validationError = selectedFiles.map(validateImage).find(Boolean);

    if (validationError) {
      setError(validationError);
      return;
    }

    setAdditionalImages((previous) => [...previous, ...selectedFiles]);

    setAdditionalPreviews((previous) => [
      ...previous,
      ...selectedFiles.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const removeMainImage = () => {
    setMainImage(null);
    setMainPreview("");

    if (mainImageRef.current) {
      mainImageRef.current.value = "";
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((previous) => previous.filter((_, i) => i !== index));

    setAdditionalPreviews((previous) => previous.filter((_, i) => i !== index));
  };

  const updateDayTiming = (
    day: DayKey,
    field: keyof DayTiming,
    value: string | boolean,
  ) => {
    setWeeklyTimings((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [field]: value,
      },
    }));
  };

  const applyToAllDays = () => {
    const mondayTiming = weeklyTimings.monday;

    setWeeklyTimings(
      Object.fromEntries(
        DAYS.map(({ key }) => [key, { ...mondayTiming }]),
      ) as Record<DayKey, DayTiming>,
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!mainImage) {
      setError("Please upload the main store image.");
      return;
    }

    if (services.length === 0) {
      setError("Please select at least one store service.");
      return;
    }

    if (!/^\d{10}$/.test(contactNumber)) {
      setError("Enter a valid 10-digit contact number.");
      return;
    }

    try {
      const parsedUrl = new URL(addressLink);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        setError("Please enter a valid Google Maps link.");
        return;
      }
    } catch {
      setError("Please enter a valid Google Maps link.");
      return;
    }

    setLoading(true);

    try {
      // Convert 24h browser time (e.g., "21:00") to 12h AM/PM format
      const formatTo12Hour = (time24: string) => {
        if (!time24) return "";

        const [h, m] = time24.split(":");
        const hours = parseInt(h, 10);
        const ampm = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;

        return `${hours12.toString().padStart(2, "0")}:${m} ${ampm}`;
      };

      const formattedWeeklyTimings = Object.fromEntries(
        DAYS.map(({ key }) => {
          const timing = weeklyTimings[key];

          return [
            key,
            {
              isClosed: timing.isClosed,
              openTime: timing.isClosed ? "" : formatTo12Hour(timing.openTime),
              closeTime: timing.isClosed
                ? ""
                : formatTo12Hour(timing.closeTime),
            },
          ];
        }),
      );

      const result = await createStore({
        name: name.trim(),
        addressLink: addressLink.trim(),
        contactNumber,
        timings: "See weekly schedule",
        services,
        weeklyTimings: formattedWeeklyTimings,
        image: mainImage,
        images: additionalImages,
      });

      setSuccess(result.message || "Store created successfully.");

      // Clear the form after successful creation.
      setName("");
      setAddressLink("");
      setContactNumber("");
      setServices([]);
      setWeeklyTimings(DEFAULT_WEEKLY_TIMINGS);
      setOpenTime("09:00");
      setCloseTime("21:00");
      setMainImage(null);
      setAdditionalImages([]);
      setMainPreview("");
      setAdditionalPreviews([]);

      if (mainImageRef.current) {
        mainImageRef.current.value = "";
      }

      if (additionalImagesRef.current) {
        additionalImagesRef.current.value = "";
      }

      // Return to the dashboard after successful creation.
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      console.error("Store creation failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create store. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f9f8] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-7 flex items-center gap-2 text-sm font-medium text-[#536b72] hover:text-[#079d98]"
        >
          <ArrowLeft size={18} />
          Back to dashboard
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#079d98]">
            <Store size={19} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Store management
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold text-[#123d4a]">
            Add a new store
          </h1>

          <p className="mt-2 text-sm text-[#70858a]">
            Enter your store details and upload its images.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store name */}

          {/* Store Details */}
          <section className="grid grid-cols-1 gap-6 rounded-2xl border border-[#dce9e6] bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[240px_1fr] lg:gap-10">
            {/* Section Information */}
            <div className="flex items-center gap-4 border-b border-[#dce7e5] pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f8f5] text-[#079d98]">
                <Store size={26} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#123d4a]">
                  Store Details
                </h2>
                <p className="mt-1 text-sm text-[#70858a]">
                  Basic information about the store.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              {/* Store Name */}
              <div>
                <label
                  htmlFor="store-name"
                  className="mb-2 block text-sm font-semibold text-[#123d4a]"
                >
                  Store name *
                </label>

                <div className="flex items-center rounded-xl border border-[#cbd9df] px-4 transition focus-within:border-[#079d98] focus-within:ring-2 focus-within:ring-[#079d98]/10">
                  <Store size={18} className="shrink-0 text-[#829397]" />

                  <input
                    id="store-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter store name"
                    minLength={2}
                    maxLength={100}
                    required
                    className="w-full bg-transparent px-3 py-3 text-sm text-[#123d4a] outline-none"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label
                  htmlFor="store-phone"
                  className="mb-2 block text-sm font-semibold text-[#123d4a]"
                >
                  Contact number *
                </label>

                <div className="flex items-center rounded-xl border border-[#cbd9df] px-4 transition focus-within:border-[#079d98] focus-within:ring-2 focus-within:ring-[#079d98]/10">
                  <Phone size={18} className="shrink-0 text-[#829397]" />

                  <span className="border-r border-[#e5ebea] px-3 py-3 text-sm text-[#536b72]">
                    +91
                  </span>

                  <input
                    id="store-phone"
                    type="tel"
                    value={contactNumber}
                    onChange={(e) =>
                      setContactNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder="10-digit phone number"
                    required
                    maxLength={10}
                    inputMode="numeric"
                    className="w-full bg-transparent px-3 py-3 text-sm text-[#123d4a] outline-none"
                  />
                </div>
              </div>

              {/* Google Maps Link */}
              <div className="md:col-span-2">
                <label
                  htmlFor="store-address"
                  className="mb-2 block text-sm font-semibold text-[#123d4a]"
                >
                  Google Maps address link *
                </label>

                <div className="flex items-center rounded-xl border border-[#cbd9df] px-4 transition focus-within:border-[#079d98] focus-within:ring-2 focus-within:ring-[#079d98]/10">
                  <MapPin size={18} className="shrink-0 text-[#829397]" />

                  <input
                    id="store-address"
                    type="url"
                    value={addressLink}
                    onChange={(e) => setAddressLink(e.target.value)}
                    placeholder="Paste Google Maps link"
                    required
                    className="w-full bg-transparent px-3 py-3 text-sm text-[#123d4a] outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          <div></div>

          {/* Operating Timings */}

          {/* Store Services and Weekly Schedule */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.85fr_1.5fr]">
            {/* Store Services */}
            <section className="rounded-2xl border border-[#dce9e6] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-7 flex items-start gap-3">
                <div className="rounded-xl bg-[#e8f8f5] p-3 text-[#079d98]">
                  <Layers size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#123d4a]">
                    Store Services
                  </h2>
                  <p className="text-sm text-[#70858a]">
                    Select one or more services offered at this store.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    name: "Phone Charging",
                    description:
                      "Customer can charge their phone at the store.",
                    icon: Zap,
                    color: "bg-[#d7faf1] text-[#00a991]",
                  },
                  {
                    name: "Pick Me Later",
                    description: "Customer can use the pick-up-later service.",
                    icon: Package,
                    color: "bg-[#eee7ff] text-[#8b5cf6]",
                  },
                ].map((service) => {
                  const ServiceIcon = service.icon;
                  const selected = services.includes(service.name);

                  return (
                    <button
                      key={service.name}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setServices((previous) =>
                          selected
                            ? previous.filter((item) => item !== service.name)
                            : [...previous, service.name],
                        )
                      }
                      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-[#079d98] bg-[#f0fbf9]"
                          : "border-[#dce7e5] hover:border-[#079d98]"
                      }`}
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${service.color}`}
                      >
                        <ServiceIcon size={25} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-[#123d4a]">
                          {service.name}
                        </span>
                        <span className="mt-1 block text-xs text-[#70858a]">
                          {service.description}
                        </span>
                      </span>

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          selected
                            ? "border-[#079d98] bg-[#079d98] text-white"
                            : "border-[#9aabb0] bg-white"
                        }`}
                      >
                        {selected && <CheckCircle2 size={15} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Weekly Store Timings */}
            <section className="min-w-0 rounded-2xl border border-[#dce9e6] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#e8f8f5] p-3 text-[#079d98]">
                    <CalendarDays size={24} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-[#123d4a]">
                      Store Timings (Weekly Schedule)
                    </h2>
                    <p className="text-sm text-[#70858a]">
                      Set opening and closing time for each day.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyToAllDays}
                  className="flex items-center gap-2 rounded-lg border border-[#079d98] px-3 py-2 text-xs font-semibold text-[#087d7b] transition hover:bg-[#eaf8f6]"
                >
                  <Copy size={15} />
                  Apply to all days
                </button>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[650px]">
                  <div className="grid grid-cols-[1fr_1.15fr_1.15fr_0.7fr] items-center gap-3 rounded-t-lg bg-[#f0f4f6] px-3 py-2 text-xs font-semibold text-[#536b72]">
                    <span>Day</span>
                    <span>Opening Time</span>
                    <span>Closing Time</span>
                    <span>Status</span>
                  </div>

                  {DAYS.map(({ key, label }) => {
                    const timing = weeklyTimings[key];

                    return (
                      <div
                        key={key}
                        className="grid grid-cols-[1fr_1.15fr_1.15fr_0.7fr] items-center gap-3 border-b border-[#e8eeee] px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-[#123d4a]">
                          {label}
                        </span>

                        <input
                          type="time"
                          value={timing.openTime}
                          disabled={timing.isClosed}
                          onChange={(e) =>
                            updateDayTiming(key, "openTime", e.target.value)
                          }
                          className="w-full rounded-lg border border-[#cbd9df] bg-white px-2 py-2 text-xs text-[#123d4a] outline-none focus:border-[#079d98] disabled:bg-gray-100 disabled:opacity-50"
                        />

                        <input
                          type="time"
                          value={timing.closeTime}
                          disabled={timing.isClosed}
                          onChange={(e) =>
                            updateDayTiming(key, "closeTime", e.target.value)
                          }
                          className="w-full rounded-lg border border-[#cbd9df] bg-white px-2 py-2 text-xs text-[#123d4a] outline-none focus:border-[#079d98] disabled:bg-gray-100 disabled:opacity-50"
                        />

                        <button
                          type="button"
                          role="switch"
                          aria-checked={!timing.isClosed}
                          aria-label={`${label} ${timing.isClosed ? "closed" : "open"}`}
                          onClick={() =>
                            updateDayTiming(key, "isClosed", !timing.isClosed)
                          }
                          className="flex items-center gap-2"
                        >
                          <span
                            className={`relative h-5 w-10 shrink-0 rounded-full transition ${
                              timing.isClosed ? "bg-gray-300" : "bg-[#079d98]"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                                timing.isClosed ? "left-0.5" : "left-[22px]"
                              }`}
                            />
                          </span>

                          <span
                            className={`text-xs font-medium ${
                              timing.isClosed
                                ? "text-gray-500"
                                : "text-[#079d98]"
                            }`}
                          >
                            {timing.isClosed ? "Closed" : "Open"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Store Images */}
          <section className="grid grid-cols-1 gap-6 rounded-2xl border border-[#dce9e6] bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[0.8fr_1.1fr_1.3fr]">
            {/* Section Information */}
            <div className="flex items-center gap-4 border-b border-[#dce7e5] pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f8f5] text-[#079d98]">
                <ImagePlus size={26} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#123d4a]">
                  Store Images
                </h2>
                <p className="mt-1 text-sm text-[#70858a]">
                  Upload main image and up to 4 additional images.
                </p>
              </div>
            </div>

            {/* Main Store Image */}
            <div className="lg:border-r lg:border-[#dce7e5] lg:pr-5">
              <label className="mb-3 block text-sm font-semibold text-[#123d4a]">
                Main store image *
              </label>

              <input
                ref={mainImageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => handleMainImage(e.target.files?.[0])}
              />

              {mainPreview ? (
                <div className="relative h-32 w-full overflow-hidden rounded-xl border border-[#dce7e5] sm:h-40">
                  <ImageWithFallback
                    src={mainPreview}
                    alt="Main store preview"
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={removeMainImage}
                    aria-label="Remove main image"
                    className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-600 shadow"
                  >
                    <X size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => mainImageRef.current?.click()}
                    className="absolute bottom-2 right-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#087d7b] shadow"
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mainImageRef.current?.click()}
                  className="flex h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#8bded4] bg-[#f1fbf9] px-3 text-center transition hover:border-[#079d98] sm:h-40"
                >
                  <Upload size={27} className="text-[#079d98]" />

                  <span className="mt-2 text-sm font-bold text-[#123d4a]">
                    Upload main image
                  </span>

                  <span className="mt-1 text-xs text-[#70858a]">
                    JPG, PNG or WEBP · Max 5 MB
                  </span>
                </button>
              )}
            </div>

            {/* Additional Images */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold text-[#123d4a]">
                  Additional images
                </label>

                <span className="text-xs text-[#70858a]">
                  ({additionalImages.length}/4)
                </span>
              </div>

              <input
                ref={additionalImagesRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  handleAdditionalImages(e.target.files);
                  e.target.value = "";
                }}
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => {
                  const preview = additionalPreviews[index];

                  return (
                    <div key={index} className="relative aspect-square min-w-0">
                      {preview ? (
                        <div className="h-full w-full overflow-hidden rounded-xl border border-[#dce7e5]">
                          <ImageWithFallback
                            src={preview}
                            alt={`Additional store image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            aria-label={`Remove additional image ${index + 1}`}
                            className="absolute right-1 top-1 rounded-full bg-white p-1.5 text-red-600 shadow"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => additionalImagesRef.current?.click()}
                          className="flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cbd9df] bg-[#f8fbfc] text-[#8297aa] transition hover:border-[#079d98] hover:bg-[#f1fbf9] hover:text-[#079d98]"
                        >
                          <ImagePlus size={23} />
                          <span className="mt-1 text-[11px] font-medium">
                            Add image
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#079d98] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#078b86] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Creating store...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Store
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
