"use client";

import useClickOutside from "@/hooks/useClickOutside";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

import Link from "next/link";
import {
  Store,
  Plus,
  Zap,
  Clock3,
  UserRound,
  MapPinned,
  LayoutDashboard,
  LogOut,
  Bell,
  ClipboardList,
} from "lucide-react";
import { usePathname } from "next/navigation";

import {
  getStoreProfileNotifications,
  markStoreProfileNotificationRead,
  type StoreProfileNotification,
} from "@/services/notificationService";

export default function Navbar() {
  const pathname = usePathname();

  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    StoreProfileNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const closeProfile = () => setProfileOpen(false);

  const profileRef = useClickOutside<HTMLDivElement>(closeProfile);
  const closeNotifications = async () => {
    setNotificationOpen(false);

    const unreadNotifications = notifications.filter(
      (notification) => !notification.isRead,
    );

    if (unreadNotifications.length === 0) return;

    const results = await Promise.allSettled(
      unreadNotifications.map((notification) =>
        markStoreProfileNotificationRead(notification._id),
      ),
    );

    const successfulIds = unreadNotifications
      .filter((_, index) => results[index].status === "fulfilled")
      .map((notification) => notification._id);

    if (successfulIds.length > 0) {
      setNotifications((current) =>
        current.filter(
          (notification) => !successfulIds.includes(notification._id),
        ),
      );

      setUnreadCount((current) => Math.max(0, current - successfulIds.length));
    }
  };

  const notificationRef = useClickOutside<HTMLDivElement>(() => {
  if (notificationOpen) {
    closeNotifications();
  }
});

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      setNotificationLoading(true);
      setNotificationError("");

      try {
        const result = await getStoreProfileNotifications();

        if (!isMounted) return;

        setNotifications(
          result.data.notifications
            .filter((notification) => !notification.isRead)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
        );
        setUnreadCount(result.data.unreadCount);
      } catch (error) {
        if (!isMounted) return;

        setNotificationError(
          error instanceof Error
            ? error.message
            : "Unable to load notifications.",
        );
      } finally {
        if (isMounted) {
          setNotificationLoading(false);
        }
      }
    };

    const handleNewStoreProfileRequest = () => {
      loadNotifications();
    };

    window.addEventListener(
      "store-profile-notification-refresh",
      handleNewStoreProfileRequest,
    );

    loadNotifications();

    return () => {
      isMounted = false;

      window.removeEventListener(
        "store-profile-notification-refresh",
        handleNewStoreProfileRequest,
      );
    };
  }, []);

  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  const isAddStoreActive = pathname === "/dashboard/add-store";
  const isStoresActive = pathname === "/dashboard/stores";
    const isStoreRequestsActive = pathname.startsWith("/dashboard/store-requests");

  return (
    <header className="relative z-10 w-full px-4 pt-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border border-[#e3eeee] bg-white/95 px-4 py-2 shadow-[0_5px_25px_rgba(18,61,74,0.08)] backdrop-blur-md sm:px-6">
        {/* Brand */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#079d98] text-white">
            <Store size={20} />
          </span>

          <span className="text-xl font-bold tracking-tight text-[#123d4a]">
            NexoPod
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          <Link
            href="/dashboard"
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium transition ${
              pathname === "/dashboard"
                ? "bg-[#079d98] text-white"
                : "text-[#536b72] hover:bg-[#eaf7f5] hover:text-[#087d7b]"
            }`}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard/add-store"
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              isAddStoreActive
                ? "bg-[#079d98] text-white"
                : "text-[#536b72] hover:bg-[#eaf7f5] hover:text-[#087d7b]"
            }`}
          >
            <Plus size={17} />
            <span>Add Store</span>
          </Link>

          <Link
            href="/dashboard/stores"
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium transition ${
              isStoresActive
                ? "bg-[#079d98] text-white"
                : "text-[#536b72] hover:bg-[#eaf7f5] hover:text-[#087d7b]"
            }`}
          >
            <MapPinned size={17} />
            <span>Stores</span>
          </Link>

                    <Link
            href="/dashboard/store-requests"
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium transition ${
              isStoreRequestsActive
                ? "bg-[#079d98] text-white"
                : "text-[#536b72] hover:bg-[#eaf7f5] hover:text-[#087d7b]"
            }`}
          >
            <ClipboardList size={17} />
            <span>Review Requests</span>
          </Link>

          <button
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium text-[#536b72] transition hover:bg-[#eaf7f5] hover:text-[#087d7b]"
          >
            <Zap size={17} />
            <span className="hidden md:inline">Phone Charging</span>
          </button>

          <button
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium text-[#536b72] transition hover:bg-[#eaf7f5] hover:text-[#087d7b]"
          >
            <Clock3 size={17} />
            <span className="hidden md:inline">Pick Me Later</span>
          </button>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {/* Store Profile Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                if (notificationOpen) {
                  closeNotifications();
                  return;
                }

                setNotificationOpen(true);
              }}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#079d98] transition hover:bg-[#eaf8f6]"
              aria-label="Notifications"
              aria-expanded={notificationOpen}
            >
              <Bell size={21} strokeWidth={1.9} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#a3d900] px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#e3eeee] bg-white shadow-[0_12px_40px_rgba(18,61,74,0.16)]">
                <div className="flex items-center justify-between border-b border-[#edf2f1] px-4 py-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#123d4a]">
                      Notifications
                    </h3>
                    <p className="text-xs text-[#829397]">
                      Store profile update requests
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#e7f8f5] px-2.5 py-1 text-xs font-semibold text-[#079d98]">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto">
                  {notificationLoading ? (
                    <p className="px-4 py-8 text-center text-sm text-[#829397]">
                      Loading notifications...
                    </p>
                  ) : notificationError ? (
                    <p className="px-4 py-8 text-center text-sm text-red-500">
                      {notificationError}
                    </p>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <Bell size={26} className="mx-auto mb-2 text-[#b5c6c5]" />
                      <p className="text-sm font-medium text-[#123d4a]">
                        You're all caught up
                      </p>
                      <p className="mt-1 text-xs text-[#829397]">
                        New store requests will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`border-b border-[#edf2f1] px-4 py-3 transition hover:bg-[#f7fbfa] ${
                          !notification.isRead ? "bg-[#f4fbfa]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!notification.isRead && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#079d98]" />
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#123d4a]">
                              {notification.title}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-[#70858a]">
                              {notification.message}
                            </p>

                            <p className="mt-1 text-[11px] text-[#9aabad]">
                              {new Date(
                                notification.createdAt,
                              ).toLocaleString()}
                            </p>

                            <button
                              type="button"
                              onClick={() => {
                                closeNotifications();

                                router.push(
                                  `/dashboard/stores/review/${notification.requestId}`,
                                );
                              }}
                              className="mt-2 text-xs font-semibold text-[#079d98] hover:text-[#067f7b]"
                            >
                              View Store →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-[#edf2f1] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      closeNotifications();
                      router.push("/dashboard/store-requests");
                    }}
                    className="w-1/2 rounded-3xl bg-[#eaf7f5] px-4 py-2.5 text-sm font-semibold text-[#079d98] transition hover:bg-[#d9f1ed]"
                  >
                    All Requests
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="Profile"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e3eceb] text-[#087d7b] transition hover:bg-[#eaf7f5]"
            >
              <UserRound size={19} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-14 z-50 w-40 rounded-2xl border border-[#e3edeb] bg-white p-4 shadow-xl">
                <div className="mb-3">
                  <p className="font-semibold text-[#123d4a]">
                    {user?.name || "Store Creator"}
                  </p>

                  <p className="mt-1 text-sm text-[#70858a]">
                    {user?.phone || "Phone number unavailable"}
                  </p>
                </div>

                <div className="border-t border-[#e3edeb] pt-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
