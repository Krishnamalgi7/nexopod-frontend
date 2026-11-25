
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Store,
  RefreshCw,
} from "lucide-react";

import API_BASE_URL from "@/services/common/api";
import { useShopOwnerAuthStore } from "@/stores/shopowner/authStore";

interface DashboardData {
  store: {
    name: string;
    isActive: boolean;
    image?: {
      type: string;
      path: string;
    };
  };
  overview: {
    total: number;
    completed: number;
    pending: number;
  };
  unreadCount: number;
  recentBookings: {
    id: string;
    service: string;
    startAt: string;
    status: "confirmed" | "in_progress" | "completed";
    customerName: string;
  }[];
}

export default function ShopOwnerDashboardPage() {
  const router = useRouter();
  const token = useShopOwnerAuthStore((state) => state.token);
  const setToken = useShopOwnerAuthStore((state) => state.setToken);
  const logout = useShopOwnerAuthStore((state) => state.logout);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("shopOwnerToken");

    if (savedToken && !token) {
      setToken(savedToken);
    }

    if (!savedToken && !token) {
      router.replace("/shopowner/login");
    }

    setAuthReady(true);
  }, [token, setToken, router]);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/dashboard`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        logout();
        router.replace("/shopowner/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/shopowner/profile");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Unable to load dashboard.");
      }

      setDashboard(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, logout, router]);

  useEffect(() => {
    if (authReady && token) {
      fetchDashboard();
    }
  }, [authReady, token, fetchDashboard]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700";
      case "in_progress":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  if (!authReady || loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E4F7F3] border-t-[#00BFA5]" />
        <p className="text-sm font-medium text-[#7B8798]">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#00BFA5] px-5 py-3 text-sm font-semibold text-white hover:bg-[#00A98F]"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-6">
      {/* Dashboard heading */}
      

      {/* Store overview */}
      <section className="overflow-hidden rounded-4xl bg-gradient-to-br from-[#164653] to-[#006B63] p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          {dashboard.store.image?.path ? (
            <div
              className="h-16 w-16 shrink-0 rounded-2xl border border-white/20 bg-cover bg-center"
              style={{
                backgroundImage: `url("${API_BASE_URL}${dashboard.store.image.path}")`,
              }}
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Store size={30} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold">
              {dashboard.store.name}
            </h2>

            <span
              className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                dashboard.store.isActive
                  ? "bg-emerald-500/20 text-emerald-100"
                  : "bg-red-500/20 text-red-100"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {dashboard.store.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </section>

      {/* Inactive store notice */}
      {!dashboard.store.isActive && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h3 className="font-bold text-red-700">
            Store Currently Inactive
          </h3>
          <p className="mt-1 text-sm leading-5 text-red-600">
            Your store is not accepting new bookings or providing services.
            You can still access your dashboard.
          </p>
          <button
            onClick={() => router.push("/shopowner/profile")}
            className="mt-3 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Go to Profile
          </button>
        </section>
      )}

      {/* Manage bookings */}
      <button
        onClick={() => router.push("/shopowner/bookings")}
        className="flex w-full items-center gap-4 rounded-3xl border border-[#E7EDF1] bg-white p-4 text-left shadow-sm transition hover:border-[#00BFA5] hover:bg-[#FAFFFE]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3] text-[#00A98F]">
          <CalendarDays size={23} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#142D46]">Manage Bookings</h3>
          <p className="mt-1 text-xs text-[#7B8798]">
            View and manage customer bookings
          </p>
        </div>

        <ChevronRight size={20} className="text-[#7B8798]" />
      </button>

      {/* Today's overview */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-[#142D46]">
          Today's Overview
        </h2>

        <div className="grid grid-cols-3 gap-3 rounded-4xl">
          <StatCard
            label="Bookings"
            value={dashboard.overview.total}
            icon={<CalendarDays size={22} />}
            color="teal"
          />
          <StatCard
            label="Completed"
            value={dashboard.overview.completed}
            icon={<CheckCircle2 size={22} />}
            color="green"
          />
          <StatCard
            label="Pending"
            value={dashboard.overview.pending}
            icon={<Clock3 size={22} />}
            color="amber"
          />
        </div>
      </section>

      {/* Recent bookings */}
      <section>
        <div className="mb-4 flex items-center justify-between rounded-4xl">
          <h2 className="text-lg font-bold text-[#142D46]">
            Recent Bookings
          </h2>

          <button
            onClick={() => router.push("/shopowner/bookings")}
            className="text-sm font-semibold text-[#00A98F] hover:text-[#008F7C]"
          >
            View All
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E7EDF1] bg-white">
          {dashboard.recentBookings.length > 0 ? (
            dashboard.recentBookings.map((booking, index) => (
              <div
                key={booking.id}
                className={`p-4 ${
                  index !== dashboard.recentBookings.length - 1
                    ? "border-b border-[#E7EDF1]"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#142D46]">
                      {booking.customerName}
                    </h3>
                    <p className="mt-1 text-sm text-[#7B8798]">
                      {booking.service}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                      booking.status,
                    )}`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </div>

                <p className="mt-3 text-xs text-[#7B8798]">
                  {formatDate(booking.startAt)}
                </p>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <CalendarDays
                size={30}
                className="mx-auto text-[#AAB5C0]"
              />
              <p className="mt-3 text-sm font-semibold text-[#142D46]">
                No recent bookings
              </p>
              <p className="mt-1 text-xs text-[#7B8798]">
                New customer bookings will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "teal" | "green" | "amber";
}) {
  const styles = {
    teal: "bg-[#E4F7F3] text-[#00A98F]",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex min-w-0 flex-col items-center rounded-2xl border border-[#E7EDF1] bg-white p-3 text-center shadow-sm sm:p-4">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${styles[color]}`}
      >
        {icon}
      </div>

      <p className="mt-3 text-xl font-bold text-[#142D46] sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold text-[#7B8798] sm:text-xs">
        {label}
      </p>
    </div>
  );
}
