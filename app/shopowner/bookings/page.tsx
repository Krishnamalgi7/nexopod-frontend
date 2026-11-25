"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  RefreshCw,
  UserRound,
  Clock3,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  ArrowLeft,
} from "lucide-react";
import API_BASE_URL from "@/services/common/api";
import { useShopOwnerAuthStore } from "@/stores/shopowner/authStore";

interface Booking {
  _id: string;
  service: "Phone Charging" | "Pick Me Later";
  startAt: string;
  status: "confirmed" | "completed" | "cancelled";
  customerId?: {
    _id: string;
    name: string;
  } | null;
  nextAction: {
    label: string;
    status: "in_progress" | "completed";
  } | null;
}

type ServiceFilter = "all" | "Phone Charging" | "Pick Me Later";

export default function ShopOwnerBookingsPage() {
  const router = useRouter();
  const token = useShopOwnerAuthStore((state) => state.token);
  const setToken = useShopOwnerAuthStore((state) => state.setToken);
  const logout = useShopOwnerAuthStore((state) => state.logout);

  const [phoneBookings, setPhoneBookings] = useState<Booking[]>([]);
  const [pickMeLaterBookings, setPickMeLaterBookings] = useState<Booking[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceFilter>("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState("");
  const [error, setError] = useState("");
  const [isStoreActive, setIsStoreActive] = useState<boolean | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const loadedCursors = useRef<string[]>([]);

  // Restore the Shop Owner token.
  useEffect(() => {
    const savedToken = localStorage.getItem("shopOwnerToken");

    if (savedToken && !token) {
      setToken(savedToken);
    } else if (!savedToken && !token) {
      router.replace("/shopowner/login");
    }
  }, [token, setToken, router]);

  // Handle expired authentication.
  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/shopowner/login");
  }, [logout, router]);

  // Fetch store activation status.
  useEffect(() => {
    if (!token) return;

    const fetchStoreStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/shop-owners/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to fetch store status.");
        }

        setIsStoreActive(result.data.store.isActive);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to fetch store status.",
        );
      }
    };

    fetchStoreStatus();
  }, [token, handleUnauthorized]);

  // Fetch bookings.
  const fetchBookings = useCallback(
    async (
      cursor: string | null = null,
      append = false,
      rememberCursor = false,
      service: ServiceFilter = selectedService,
    ) => {
      if (!token) return null;

      try {
        setError("");

        const cursorQuery = cursor
          ? `&cursor=${encodeURIComponent(cursor)}`
          : "";

        const response = await fetch(
          `${API_BASE_URL}/api/shop-owners/bookings?limit=20&service=${encodeURIComponent(service)}${cursorQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();

        if (response.status === 401) {
          handleUnauthorized();
          return null;
        }

        if (response.status === 403) {
          router.replace("/shopowner/profile");
          return null;
        }

        if (!response.ok) {
          throw new Error(result.message || "Unable to load bookings.");
        }

        const newPhoneBookings: Booking[] =
          result.data.phoneCharging?.bookings || [];

        const newPickMeLaterBookings: Booking[] =
          result.data.pickMeLater?.bookings || [];

        const mergeBookings = (previous: Booking[], incoming: Booking[]) => {
          if (!append) return incoming;

          const unique = new Map(
            previous.map((booking) => [booking._id, booking]),
          );

          incoming.forEach((booking) => unique.set(booking._id, booking));

          return Array.from(unique.values());
        };

        setPhoneBookings((previous) =>
          mergeBookings(previous, newPhoneBookings),
        );

        setPickMeLaterBookings((previous) =>
          mergeBookings(previous, newPickMeLaterBookings),
        );

        const responseNextCursor = result.data.pagination?.nextCursor || null;

        setNextCursor(responseNextCursor);
        setHasNextPage(result.data.pagination?.hasNextPage || false);

        if (!append) {
          loadedCursors.current = [];
        } else if (rememberCursor && cursor) {
          loadedCursors.current = [...loadedCursors.current, cursor];
        }

        return responseNextCursor;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to connect to server.",
        );
        return null;
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [token, selectedService, handleUnauthorized, router],
  );

  // Initial fetch and filter changes.
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetchBookings(null, false, false, selectedService);
  }, [token, selectedService, fetchBookings]);

  // Reload all currently loaded pages.
  const refreshLoadedBookings = async () => {
    setRefreshing(true);

    const pagesToReload = loadedCursors.current.length + 1;
    let cursor: string | null = null;

    for (let page = 0; page < pagesToReload; page++) {
      const next = await fetchBookings(
        cursor,
        page > 0,
        page > 0,
        selectedService,
      );

      if (!next) break;
      cursor = next;
    }

    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!hasNextPage || loadingMore || !nextCursor) return;

    setLoadingMore(true);
    fetchBookings(nextCursor, true, true);
  };

  const handleUpdateStatus = async (
    bookingId: string,
    status: "in_progress" | "completed",
  ) => {
    if (!token) return;

    try {
      setUpdatingBookingId(bookingId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to update booking.");
      }

      await refreshLoadedBookings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update booking.",
      );
    } finally {
      setUpdatingBookingId("");
    }
  };

  const formatBookingDate = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

  const getStatusLabel = (status: Booking["status"]) => {
    if (status === "cancelled") return "Cancelled";
    if (status === "completed") return "Completed";
    return "Confirmed";
  };

  const bookings =
    selectedService === "Phone Charging"
      ? phoneBookings
      : selectedService === "Pick Me Later"
        ? pickMeLaterBookings
        : [...phoneBookings, ...pickMeLaterBookings];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-8">
      {/* Page heading */}
      
      {/* Bookings Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/shopowner/dashboard")}
            aria-label="Back to Dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#00B894] shadow-sm"
          >
            <ArrowLeft size={21} strokeWidth={2.2} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-[#123D4A]">
              Bookings
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Manage your store bookings
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshLoadedBookings}
          disabled={refreshing || loading}
          aria-label="Refresh bookings"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#00B894] disabled:opacity-50"
        >
          <RefreshCw
            size={25}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Store Inactive Notice */}
      {isStoreActive === false && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-800">Store currently inactive</p>
          <p className="mt-1 text-sm text-amber-700">
            Booking status actions are disabled until your store is active.
          </p>
          <button
            onClick={() => router.push("/shopowner/profile")}
            className="mt-2 text-sm font-bold text-amber-800 underline"
          >
            Go to Profile
          </button>
        </div>
      )}

            {/* Service Filters */}
      <section className="rounded-full border border-[#E8EEF1] bg-[#E8EEF1] p-1">
        <div className="grid grid-cols-3 gap-1">
          {(["all", "Phone Charging", "Pick Me Later"] as const).map(
            (service) => (
              <button
                key={service}
                onClick={() => setSelectedService(service)}
                className={`flex min-h-10 items-center justify-center rounded-full px-1 text-xs font-bold transition sm:text-sm ${
                  selectedService === service
                    ? "bg-[#164653] text-white shadow-sm"
                    : "text-[#64748B]"
                }`}
              >
                {service === "all" ? "All" : service}
              </button>
            ),
          )}
        </div>
      </section>


      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button
            onClick={() => fetchBookings()}
            className="mt-2 font-bold underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Booking list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#142D46]">
              Customer Bookings
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-[#E7EDF1] bg-white">
            <LoaderCircle size={32} className="animate-spin text-[#00BFA5]" />
            <p className="mt-3 text-sm font-medium text-[#7B8798]">
              Loading bookings...
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-[#E7EDF1] bg-white px-5 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E4F7F3] text-[#00A98F]">
              <CalendarDays size={30} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#142D46]">
              No bookings yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-[#7B8798]">
              New customer bookings will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, index) => {
              const action = booking.nextAction;
              const isUpdating = updatingBookingId === booking._id;

              const statusStyle =
                booking.status === "cancelled"
                  ? "bg-red-50 text-red-700"
                  : booking.status === "completed"
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700";

              return (
                <article
                  key={booking._id}
                  className="rounded-2xl border border-[#E8EEF1] bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-[#123D4A]">
                        {booking.service}
                      </h3>

                      <p className="mt-1 text-sm text-[#64748B]">
                        {booking.customerId?.name || "Customer"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="my-4 h-px bg-[#F1F5F9]" />

                  <p className="text-xs font-medium text-[#94A3B8]">
                    BOOKING DATE & TIME
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#123D4A]">
                    {formatBookingDate(booking.startAt)}
                  </p>

                  {action ? (
                    <button
                      onClick={() =>
                        handleUpdateStatus(booking._id, action.status)
                      }
                      disabled={
                        isStoreActive !== true || Boolean(updatingBookingId)
                      }
                      className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#00B894] text-sm font-bold text-white transition hover:bg-[#009F80] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <LoaderCircle size={20} className="animate-spin" />
                      ) : (
                        action.label
                      )}
                    </button>
                  ) : (
                    <div className="mt-4 rounded-xl bg-[#F1F5F9] py-3 text-center">
                      <span className="text-sm font-semibold text-[#64748B]">
                        {booking.status === "cancelled"
                          ? "Booking cancelled"
                          : "Booking completed"}
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {hasNextPage && !loading && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#B8EDE3] bg-white font-bold text-[#00A98F] transition hover:bg-[#E4F7F3] disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Bookings"
            )}
          </button>
        )}
      </section>
    </div>
  );
}
