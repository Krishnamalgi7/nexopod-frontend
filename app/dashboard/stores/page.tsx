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
} from "lucide-react";

import {
  getStores,
  updateStoreStatus,
  updateStoreDetails,
  type StoreItem,
  type PaginationData,
} from "@/services/storeService";
import API_BASE_URL from "@/services/api";

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
  const [editForm, setEditForm] = useState({
    name: "",
    contactNumber: "",
    addressLink: "",
    openTime: "",
    closeTime: "",
  });

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
    // Parse "10:00 AM - 09:00 PM" into 24h format ("10:00", "21:00") for the time pickers
    const parse12To24 = (time12: string) => {
      if (!time12) return "";
      const [time, modifier] = time12.split(" ");
      let [hours, minutes] = time.split(":");
      if (hours === "12") hours = "00";
      if (modifier === "PM") hours = (parseInt(hours, 10) + 12).toString();
      return `${hours.padStart(2, "0")}:${minutes}`;
    };

    let openTime = "10:00";
    let closeTime = "21:00";

    if (store.timings && store.timings.includes(" - ")) {
      const [openStr, closeStr] = store.timings.split(" - ");
      openTime = parse12To24(openStr);
      closeTime = parse12To24(closeStr);
    }

    setEditForm({
      name: store.name,
      contactNumber: store.contactNumber,
      addressLink: store.addressLink,
      openTime,
      closeTime,
    });
    setStoreToEdit(store);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeToEdit) return;

    // Convert back to 12h for the backend
    const formatTo12Hour = (time24: string) => {
      if (!time24) return "";
      const [h, m] = time24.split(":");
      const hours = parseInt(h, 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      return `${hours12.toString().padStart(2, "0")}:${m} ${ampm}`;
    };
    const formattedTimings = `${formatTo12Hour(editForm.openTime)} - ${formatTo12Hour(editForm.closeTime)}`;

    try {
      setUpdatingId(storeToEdit._id);
      const updated = await updateStoreDetails(storeToEdit._id, {
        name: editForm.name,
        contactNumber: editForm.contactNumber,
        addressLink: editForm.addressLink,
        timings: formattedTimings,
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
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-[#e3edeb] bg-[#f8fcfb] text-xs font-semibold uppercase tracking-wider text-[#536b72]">
                <tr>
                  <th className="px-6 py-4">Store Details</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3edeb]">
                {loading && stores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <LoaderCircle
                        size={30}
                        className="mx-auto animate-spin text-[#079d98]"
                      />
                      <p className="mt-3 text-[#70858a]">Loading stores...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-red-600">
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
                            {store.image?.path ? (
                              <img
                                src={`${API_BASE_URL}${store.image.path}`}
                                alt={store.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[#079d98]">
                                <ImageOff size={20} />
                              </div>
                            )}
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
                          +91 {store.contactNumber}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#70858a]">
                          <Clock size={13} />
                          {store.timings}
                        </p>
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(store)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce9e6] bg-white text-[#536b72] transition hover:bg-[#eaf8f6] hover:text-[#079d98]"
                            title="Edit Store Details"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setStoreToToggle(store)}
                            className={`inline-flex min-w-[90px] items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
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

      {/* THEMED CONFIRMATION MODAL */}
      {storeToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123d4a]/40 backdrop-blur-sm p-4">
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
            onSubmit={handleEditSubmit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-xl font-bold text-[#123d4a]">
              Edit Store Details
            </h3>
            <p className="mt-1 text-sm text-[#70858a]">
              Update the contact and location information below.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#123d4a]">
                  Store Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full rounded-xl border border-[#dce9e6] px-4 py-2.5 text-sm outline-none transition focus:border-[#079d98]"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#123d4a]">
                  Contact Number
                </label>

                <div className="flex items-center rounded-xl border border-[#dce9e6] px-4 focus-within:border-[#079d98] focus-within:ring-2 focus-within:ring-[#079d98]/10">
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
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-[#123d4a] outline-none"
                  />
                </div>
              </div>

              {/* Map input field */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#123d4a]">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  value={editForm.addressLink}
                  onChange={(e) =>
                    setEditForm({ ...editForm, addressLink: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-[#dce9e6] px-4 py-2.5 text-sm outline-none transition focus:border-[#079d98]"
                />
              </div>

              {/* Operating Timings */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#123d4a]">
                  Operating Timings
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  {/* Opening Time */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#70858a]">
                      Opening time
                    </label>
                    <input
                      type="time"
                      value={editForm.openTime}
                      onChange={(e) =>
                        setEditForm({ ...editForm, openTime: e.target.value })
                      }
                      required
                      className="w-full rounded-xl border border-[#dce9e6] bg-white px-4 py-3 text-sm text-[#123d4a] outline-none transition focus:border-[#079d98] focus:ring-2 focus:ring-[#079d98]/10 cursor-pointer"
                    />
                  </div>

                  <span className="hidden pb-3 text-sm font-medium text-[#70858a] sm:block">
                    to
                  </span>

                  {/* Closing Time */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#70858a]">
                      Closing time
                    </label>
                    <input
                      type="time"
                      value={editForm.closeTime}
                      onChange={(e) =>
                        setEditForm({ ...editForm, closeTime: e.target.value })
                      }
                      required
                      className="w-full rounded-xl border border-[#dce9e6] bg-white px-4 py-3 text-sm text-[#123d4a] outline-none transition focus:border-[#079d98] focus:ring-2 focus:ring-[#079d98]/10 cursor-pointer"
                    />
                  </div>
                </div>
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
