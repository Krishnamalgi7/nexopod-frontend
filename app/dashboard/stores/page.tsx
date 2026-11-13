"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Store,
  MapPin,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ImageOff,
  ExternalLink,
  Pencil,
  Clock,
  Phone,
  X,
  CalendarDays,
  Copy,
  Zap,
  Package,
  Layers,
  CheckCircle2,
} from "lucide-react";

import {
  getStores,
  updateStoreStatus,
  updateStoreDetails,
  type StoreItem,
  type PaginationData,
  type StoreDayTiming,
} from "@/services/storeService";

import API_BASE_URL from "@/services/api";
import ImageWithFallback from "@/components/ImageWithFallback";
import useClickOutside from "@/hooks/useClickOutside";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_EDIT_WEEKLY_TIMINGS: Record<DayKey, StoreDayTiming> = {
  monday: { isClosed: false, openTime: "10:00 AM", closeTime: "09:00 PM" },
  tuesday: { isClosed: false, openTime: "10:00 AM", closeTime: "09:00 PM" },
  wednesday: { isClosed: false, openTime: "10:00 AM", closeTime: "09:00 PM" },
  thursday: { isClosed: false, openTime: "10:00 AM", closeTime: "09:00 PM" },
  friday: { isClosed: false, openTime: "10:00 AM", closeTime: "10:00 PM" },
  saturday: { isClosed: false, openTime: "10:00 AM", closeTime: "10:00 PM" },
  sunday: { isClosed: false, openTime: "11:00 AM", closeTime: "08:00 PM" },
};

export default function StoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters & Pagination State
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modals State
  const [storeToToggle, setStoreToToggle] = useState<StoreItem | null>(null);
  const [storeToEdit, setStoreToEdit] = useState<StoreItem | null>(null);

  const [selectedScheduleStore, setSelectedScheduleStore] =
    useState<StoreItem | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    contactNumber: "",
    addressLink: "",
    openTime: "",
    closeTime: "",
  });

  const [editServices, setEditServices] = useState<string[]>([]);

  const [editWeeklyTimings, setEditWeeklyTimings] = useState<
    Record<DayKey, StoreDayTiming>
  >(DEFAULT_EDIT_WEEKLY_TIMINGS);

  // Edit Store Image Management
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  const [newAdditionalImageFiles, setNewAdditionalImageFiles] = useState<
    File[]
  >([]);
  const [newAdditionalImagePreviews, setNewAdditionalImagePreviews] = useState<
    string[]
  >([]);

  const [retainedAdditionalImages, setRetainedAdditionalImages] = useState<
    string[]
  >([]);

  const mainImageInputRef = useRef<HTMLInputElement>(null);

  const additionalImagesInputRef = useRef<HTMLInputElement>(null);

  const closeEditModal = useCallback(() => {
    setStoreToEdit(null);
  }, []);

  const editModalRef = useClickOutside<HTMLFormElement>(closeEditModal);

  const handleAdditionalImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    const availableSlots =
      4 - retainedAdditionalImages.length - newAdditionalImageFiles.length;

    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/"),
    );

    const filesToAdd = imageFiles.slice(0, availableSlots);

    if (imageFiles.length !== selectedFiles.length) {
      alert("Only image files are allowed.");
    }

    if (imageFiles.length > availableSlots) {
      alert("You can upload a maximum of 4 additional images.");
    }

    if (filesToAdd.length > 0) {
      setNewAdditionalImageFiles((prev) => [...prev, ...filesToAdd]);

      setNewAdditionalImagePreviews((prev) => [
        ...prev,
        ...filesToAdd.map((file) => URL.createObjectURL(file)),
      ]);
    }

    // Allow selecting the same files again.
    e.target.value = "";
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));

    // Allow selecting the same file again.
    e.target.value = "";
  };

  // Handle click outside for custom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchStoresData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getStores({
        search: debouncedSearch,
        status: statusFilter,
        page: currentPage,
        limit: 10,
      });
      setStores(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load stores.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage]);

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

  const selectStatusFilter = (status: "all" | "active" | "inactive") => {
    setStatusFilter(status);
    setCurrentPage(1);
    setIsDropdownOpen(false);
  };

  // Confirm Toggle Action
  const handleConfirmToggle = async () => {
    if (!storeToToggle) return;
    try {
      setUpdatingId(storeToToggle._id);
      await updateStoreStatus(storeToToggle._id, !storeToToggle.isActive);
      setStores((prev) =>
        prev.map((store) =>
          store._id === storeToToggle._id
            ? { ...store, isActive: !storeToToggle.isActive }
            : store,
        ),
      );
      setStoreToToggle(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (store: StoreItem) => {
    // Convert backend 12-hour time into the format required by input[type="time"].
    const parse12To24 = (time12: string | undefined): string => {
      if (!time12) return "";

      const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

      if (!match) return "";

      let hours = Number(match[1]);
      const minutes = match[2];
      const period = match[3].toUpperCase();

      if (period === "AM" && hours === 12) {
        hours = 0;
      } else if (period === "PM" && hours !== 12) {
        hours += 12;
      }

      return `${String(hours).padStart(2, "0")}:${minutes}`;
    };

    setEditForm({
      name: store.name,
      contactNumber: store.contactNumber,
      addressLink: store.addressLink,
      openTime: "",
      closeTime: "",
    });

    // Load the saved services.
    setEditServices(store.services || []);

    // Load each saved day. Use defaults only for stores without weekly timings.
    const loadedTimings = Object.fromEntries(
      DAYS.map(({ key }) => {
        const savedTiming = store.weeklyTimings?.[key];
        const fallbackTiming = DEFAULT_EDIT_WEEKLY_TIMINGS[key];

        return [
          key,
          {
            isClosed: savedTiming?.isClosed ?? fallbackTiming.isClosed,
            openTime: parse12To24(
              savedTiming?.openTime || fallbackTiming.openTime,
            ),
            closeTime: parse12To24(
              savedTiming?.closeTime || fallbackTiming.closeTime,
            ),
          },
        ];
      }),
    ) as Record<DayKey, StoreDayTiming>;

    setEditWeeklyTimings(loadedTimings);

    // Reset image selections whenever a store is opened for editing.
    setMainImageFile(null);
    setMainImagePreview(null);

    setNewAdditionalImageFiles([]);
    setNewAdditionalImagePreviews([]);

    setRetainedAdditionalImages(
      (store.images || []).map((image) => image.path),
    );

    setStoreToEdit(store);
  };

  const format24To12 = (time24: string): string => {
    if (!time24) return "";

    const [hoursString, minutes] = time24.split(":");
    const hours = Number(hoursString);

    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;

    return `${String(hours12).padStart(2, "0")}:${minutes} ${period}`;
  };

  const updateEditDayTiming = (
    day: DayKey,
    field: keyof StoreDayTiming,
    value: string | boolean,
  ) => {
    setEditWeeklyTimings((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [field]: value,
      },
    }));
  };

  const applyEditTimingToAllDays = () => {
    const mondayTiming = editWeeklyTimings.monday;

    setEditWeeklyTimings(
      Object.fromEntries(
        DAYS.map(({ key }) => [key, { ...mondayTiming }]),
      ) as Record<DayKey, StoreDayTiming>,
    );
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeToEdit) return;

    try {
      setUpdatingId(storeToEdit._id);

      const formattedWeeklyTimings = Object.fromEntries(
        DAYS.map(({ key }) => {
          const timing = editWeeklyTimings[key];

          return [
            key,
            {
              isClosed: timing.isClosed,
              openTime: timing.isClosed
                ? ""
                : format24To12(timing.openTime || ""),
              closeTime: timing.isClosed
                ? ""
                : format24To12(timing.closeTime || ""),
            },
          ];
        }),
      ) as Record<DayKey, StoreDayTiming>;

      const updated = await updateStoreDetails(storeToEdit._id, {
        name: editForm.name,
        contactNumber: editForm.contactNumber,
        addressLink: editForm.addressLink,

        timings: "See weekly schedule",
        services: editServices,
        weeklyTimings: formattedWeeklyTimings,

        existingImages: retainedAdditionalImages,
        image: mainImageFile,
        images: newAdditionalImageFiles,
      });

      setStores((prev) =>
        prev.map((s) =>
          s._id === storeToEdit._id ? { ...s, ...updated.data } : s,
        ),
      );

      setStoreToEdit(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update store");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f9f8] px-4 py-8 sm:px-6 relative">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header layout matching reference image */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-[#079d98]">
              <Store size={19} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Store management
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-[#123d4a]">
              Locations Directory
            </h1>
            <p className="mt-1 text-sm text-[#70858a]">
              View and manage locations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829397]"
              />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-[#dce9e6] bg-white py-2.5 pl-9 pr-4 text-sm text-[#123d4a] outline-none transition focus:border-[#079d98] focus:ring-1 focus:ring-[#079d98]"
              />
            </div>

            {/* Custom Rotating Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#dce9e6] bg-white px-4 py-2.5 text-sm font-medium text-[#123d4a] transition hover:bg-[#eaf8f6] min-w-[140px]"
              >
                {statusFilter === "all"
                  ? "All Statuses"
                  : statusFilter === "active"
                    ? "Active"
                    : "Inactive"}
                <ChevronDown
                  size={16}
                  className={`text-[#829397] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-full rounded-xl border border-[#dce9e6] bg-white p-1.5 shadow-lg z-20">
                  <button
                    onClick={() => selectStatusFilter("all")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#536b72] hover:bg-[#eaf8f6] hover:text-[#079d98]"
                  >
                    All Statuses
                  </button>
                  <button
                    onClick={() => selectStatusFilter("active")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#536b72] hover:bg-[#eaf8f6] hover:text-[#079d98]"
                  >
                    Active
                  </button>
                  <button
                    onClick={() => selectStatusFilter("inactive")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#536b72] hover:bg-[#eaf8f6] hover:text-[#079d98]"
                  >
                    Inactive
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-2xl border border-[#e3edeb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
              {/* Store Details 20%, Contact 14%, Schedule 15%, Location 12%, Services 18%, Status 9%, Actions 12% */}
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[9%]" />
                <col className="w-[12%]" />
              </colgroup>

              <thead className="border-b border-[#e3edeb] bg-[#f8fcfb] text-xs font-semibold uppercase tracking-wider text-[#536b72]">
                <tr>
                  <th className="px-6 py-4">Store Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-10 py-4">Schedule</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-15 py-4">Services</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3edeb]">
                {loading && stores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <LoaderCircle
                        size={30}
                        className="mx-auto animate-spin text-[#079d98]"
                      />
                      <p className="mt-3 text-[#70858a]">Loading stores...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-red-600">
                      <p className="font-semibold">{error}</p>
                      <button
                        onClick={fetchStoresData}
                        className="mt-3 text-sm underline"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                ) : stores.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-[#70858a]"
                    >
                      <p>No stores found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr
                      key={store._id}
                      className="transition-colors hover:bg-[#fcfefe]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#e3edeb] bg-[#eaf3f1]">
                            <ImageWithFallback
                              src={
                                store.image?.path
                                  ? `${API_BASE_URL}${store.image.path}`
                                  : null
                              }
                              alt={store.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-[#123d4a]">
                              {store.name}
                            </p>
                            <p className="text-xs text-[#829397]">
                              Added{" "}
                              {new Date(store.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#123d4a]">
                           {store.contactNumber}
                        </p>
                  
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedScheduleStore(store)}
                          className="inline-flex items-center gap-2 rounded-3xl border border-[#bde9df] bg-[#eafaf5] px-1 py-2 text-xs font-semibold text-[#087d7b] transition hover:bg-[#d9f5ed]"
                        >
                          <CalendarDays size={15} />
                          View Schedule
                        </button>
                      </td>

                      <td className="px-4 py-4">
                        <a
                          href={store.addressLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#079d98] hover:underline"
                        >
                          <MapPin size={15} />
                          View Map
                          <ExternalLink size={13} />
                        </a>
                      </td>

                      <td className="px-9 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {store.services && store.services.length > 0 ? (
                            store.services.map((service) => (
                              <span
                                key={service}
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                                  service === "Phone Charging"
                                    ? "bg-[#d7faf1] text-[#008f7b]"
                                    : service === "Pick Me Later"
                                      ? "bg-[#eee7ff] text-[#7c3aed]"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {service === "Phone Charging" ? (
                                  <Zap size={14} />
                                ) : service === "Pick Me Later" ? (
                                  <Package size={14} />
                                ) : null}

                                {service}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-[#829397]">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            store.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {store.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(store)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dce9e6] bg-white text-[#536b72] transition hover:bg-[#eaf8f6] hover:text-[#079d98]"
                            title="Edit Store Details"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setStoreToToggle(store)}
                            className={`inline-flex min-w-[90px] shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              store.isActive
                                ? "bg-white text-red-600 border border-red-200 hover:bg-red-50"
                                : "bg-white text-[#079d98] border border-[#dce9e6] hover:bg-[#eaf8f6]"
                            }`}
                          >
                            {store.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#e3edeb] bg-[#f8fcfb] px-6 py-4">
              <span className="text-sm text-[#70858a]">
                Showing page{" "}
                <span className="font-semibold text-[#123d4a]">
                  {pagination.currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#123d4a]">
                  {pagination.totalPages}
                </span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="flex items-center gap-1 rounded-lg border border-[#dce9e6] bg-white px-3 py-1.5 text-sm font-medium text-[#536b72] transition hover:bg-[#eaf8f6] disabled:opacity-50"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1),
                    )
                  }
                  disabled={!pagination.hasNextPage}
                  className="flex items-center gap-1 rounded-lg border border-[#dce9e6] bg-white px-3 py-1.5 text-sm font-medium text-[#536b72] transition hover:bg-[#eaf8f6] disabled:opacity-50"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WEEKLY SCHEDULE POPUP */}
      {selectedScheduleStore && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#123d4a]/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedScheduleStore(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-popup-title"
            className="w-full max-w-md rounded-2xl border border-[#dce9e6] bg-white p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3
                  id="schedule-popup-title"
                  className="text-lg font-bold text-[#123d4a]"
                >
                  Weekly Schedule
                </h3>
                <p className="mt-1 text-sm text-[#70858a]">
                  {selectedScheduleStore.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedScheduleStore(null)}
                aria-label="Close schedule"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#70858a] transition hover:bg-[#eaf8f6]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {DAYS.map(({ key, label }) => {
                const timing = selectedScheduleStore.weeklyTimings?.[key];

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 border-b border-[#edf2f1] pb-3 last:border-0"
                  >
                    <span className="text-sm font-semibold text-[#123d4a]">
                      {label}
                    </span>

                    {timing?.isClosed ? (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                        Closed
                      </span>
                    ) : timing?.openTime && timing?.closeTime ? (
                      <span className="text-right text-sm font-medium text-[#536b72]">
                        {timing.openTime} – {timing.closeTime}
                      </span>
                    ) : (
                      <span className="text-xs text-[#829397]">
                        Not configured
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* THEMED CONFIRMATION MODAL */}
      {storeToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123d4a]/40 backdrop-blur-sm p-3 sm:p-5">
          <div className="w-full max-w-md rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-[#123d4a]">
              Confirm {storeToToggle.isActive ? "Deactivation" : "Activation"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#70858a]">
              Are you sure you want to{" "}
              {storeToToggle.isActive ? "deactivate" : "activate"}{" "}
              <span className="font-semibold text-[#123d4a]">
                "{storeToToggle.name}"
              </span>
              ?
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStoreToToggle(null)}
                disabled={updatingId === storeToToggle._id}
                className="rounded-xl border border-[#dce9e6] bg-white px-5 py-2.5 text-sm font-semibold text-[#536b72] transition hover:bg-[#eaf8f6] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                disabled={updatingId === storeToToggle._id}
                className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition shadow-sm disabled:opacity-60 ${
                  storeToToggle.isActive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#079d98] hover:bg-[#078b86]"
                }`}
              >
                {updatingId === storeToToggle._id && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                {storeToToggle.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHT EDIT MODAL */}
      {storeToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123d4a]/40 backdrop-blur-sm p-4">
          <form
            ref={editModalRef}
            onSubmit={handleEditSubmit}
            className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#dce9e6] bg-[#f4f9f8] p-4 shadow-2xl sm:p-6 lg:p-8"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#123d4a]">
                  Edit Store Details
                </h3>

                <p className="mt-1 text-sm text-[#70858a]">
                  Update the contact and location information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Close edit store modal"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-3xl cursor-pointer text-[#70858a] transition hover:bg-[#e8f3f1] hover:text-[#123d4a]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Store Image Preview */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-[#123d4a]">
                Store Main Image
              </label>

              <div className="h-44 w-full overflow-hidden rounded-xl border border-[#dce9e6] bg-[#f4f9f8]">
                <ImageWithFallback
                  src={
                    mainImagePreview ||
                    (storeToEdit.image?.path
                      ? `${API_BASE_URL}${storeToEdit.image.path}`
                      : null)
                  }
                  alt={`${storeToEdit.name} main image`}
                  className="h-full w-full object-cover"
                />
              </div>

              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleMainImageChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                className="mt-3 rounded-lg border border-[#079d98] px-4 py-2 text-sm font-semibold text-[#079d98] transition hover:bg-[#eaf8f6]"
              >
                Change Main Image
              </button>
            </div>

            {/* Additional Store Images Management */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-[#123d4a]">
                  Additional Store Images
                </label>

                <span className="text-xs text-[#70858a]">
                  {retainedAdditionalImages.length +
                    newAdditionalImageFiles.length}
                  /4 images
                </span>
              </div>

              <input
                ref={additionalImagesInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleAdditionalImagesChange}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Existing images */}
                {retainedAdditionalImages.map((imagePath, index) => (
                  <div
                    key={imagePath}
                    className="relative h-24 overflow-hidden rounded-xl border border-[#dce9e6] bg-[#f4f9f8]"
                  >
                    <ImageWithFallback
                      src={`${API_BASE_URL}${imagePath}`}
                      alt={`${storeToEdit.name} additional image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setRetainedAdditionalImages((prev) =>
                          prev.filter((path) => path !== imagePath),
                        )
                      }
                      className="absolute right-1 top-1 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {/* Newly selected images */}
                {newAdditionalImagePreviews.map((preview, index) => (
                  <div
                    key={preview}
                    className="relative h-24 overflow-hidden rounded-xl border border-[#dce9e6] bg-[#f4f9f8]"
                  >
                    <ImageWithFallback
                      src={preview}
                      alt={`New additional image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setNewAdditionalImageFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        );

                        setNewAdditionalImagePreviews((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                      className="absolute right-1 top-1 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {retainedAdditionalImages.length +
                newAdditionalImageFiles.length <
                4 && (
                <button
                  type="button"
                  onClick={() => additionalImagesInputRef.current?.click()}
                  className="mt-3 rounded-lg border border-dashed border-[#079d98] px-4 py-2 text-sm font-semibold text-[#079d98] transition hover:bg-[#eaf8f6]"
                >
                  + Add Images
                </button>
              )}

              {retainedAdditionalImages.length +
                newAdditionalImageFiles.length ===
                0 && (
                <p className="mt-2 text-xs text-[#829397]">
                  No additional images selected.
                </p>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {/* Store Details */}
              <section className="mt-6 grid grid-cols-1 gap-6 rounded-2xl border border-[#dce9e6] bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[240px_1fr] lg:gap-10">
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
                    <label className="mb-2 block text-sm font-semibold text-[#123d4a]">
                      Store name *
                    </label>

                    <div className="flex items-center rounded-xl border border-[#cbd9df] px-4 transition focus-within:border-[#079d98] focus-within:ring-2 focus-within:ring-[#079d98]/10">
                      <Store size={18} className="shrink-0 text-[#829397]" />

                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="Enter store name"
                        className="w-full bg-transparent px-3 py-3 text-sm text-[#123d4a] outline-none"
                      />
                    </div>
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123d4a]">
                      Contact number *
                    </label>

                    <div className="flex items-center rounded-xl border border-[#cbd9df] px-4 transition focus-within:border-[#079d98] focus-within:ring-2 focus-within:ring-[#079d98]/10">
                      <Phone size={18} className="shrink-0 text-[#829397]" />

                      <span className="border-r border-[#e5ebea] px-3 py-3 text-sm text-[#536b72]">
                        +91
                      </span>

                      <input
                        type="tel"
                        value={editForm.contactNumber}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            contactNumber: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10),
                          })
                        }
                        required
                        pattern="[0-9]{10}"
                        maxLength={10}
                        inputMode="numeric"
                        placeholder="10-digit phone number"
                        className="w-full bg-transparent px-3 py-3 text-sm text-[#123d4a] outline-none"
                      />
                    </div>
                  </div>

                  {/* Google Maps Link */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#123d4a]">
                      Google Maps address link *
                    </label>

                    <div className="flex items-center rounded-xl border border-[#cbd9df] px-4 transition focus-within:border-[#079d98] focus-within:ring-2 focus-within:ring-[#079d98]/10">
                      <MapPin size={18} className="shrink-0 text-[#829397]" />

                      <input
                        type="url"
                        value={editForm.addressLink}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            addressLink: e.target.value,
                          })
                        }
                        required
                        placeholder="Paste Google Maps link"
                        className="w-full bg-transparent px-3 py-3 text-sm text-[#123d4a] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Store Services + Weekly Schedule */}
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
                        description:
                          "Customer can use the pick-up-later service.",
                        icon: Package,
                        color: "bg-[#eee7ff] text-[#8b5cf6]",
                      },
                    ].map((service) => {
                      const ServiceIcon = service.icon;
                      const selected = editServices.includes(service.name);

                      return (
                        <button
                          key={service.name}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            setEditServices((previous) =>
                              selected
                                ? previous.filter(
                                    (item) => item !== service.name,
                                  )
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
                      onClick={applyEditTimingToAllDays}
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
                        const timing = editWeeklyTimings[key];

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
                              value={timing.openTime || ""}
                              disabled={timing.isClosed}
                              onChange={(e) =>
                                updateEditDayTiming(
                                  key,
                                  "openTime",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-[#cbd9df] bg-white px-2 py-2 text-xs text-[#123d4a] outline-none focus:border-[#079d98] disabled:bg-gray-100 disabled:opacity-50"
                            />

                            <input
                              type="time"
                              value={timing.closeTime || ""}
                              disabled={timing.isClosed}
                              onChange={(e) =>
                                updateEditDayTiming(
                                  key,
                                  "closeTime",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-[#cbd9df] bg-white px-2 py-2 text-xs text-[#123d4a] outline-none focus:border-[#079d98] disabled:bg-gray-100 disabled:opacity-50"
                            />

                            <button
                              type="button"
                              role="switch"
                              aria-checked={!timing.isClosed}
                              aria-label={`${label} ${timing.isClosed ? "closed" : "open"}`}
                              onClick={() =>
                                updateEditDayTiming(
                                  key,
                                  "isClosed",
                                  !timing.isClosed,
                                )
                              }
                              className="flex items-center gap-2"
                            >
                              <span
                                className={`relative h-5 w-10 shrink-0 rounded-full transition ${
                                  timing.isClosed
                                    ? "bg-gray-300"
                                    : "bg-[#079d98]"
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
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStoreToEdit(null)}
                disabled={updatingId === storeToEdit._id}
                className="rounded-xl border border-[#dce9e6] bg-white px-5 py-2.5 text-sm font-semibold text-[#536b72] transition hover:bg-[#eaf8f6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingId === storeToEdit._id}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#079d98] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#078b86] disabled:opacity-60"
              >
                {updatingId === storeToEdit._id && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
