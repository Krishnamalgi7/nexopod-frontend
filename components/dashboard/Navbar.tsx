"use client";

import useClickOutside from "@/hooks/useClickOutside";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);

  const closeProfile = () => setProfileOpen(false);

const profileRef = useClickOutside<HTMLDivElement>(closeProfile);

  const [user] = useState(() => {
    if (typeof window === "undefined") return null;

    const savedUser = sessionStorage.getItem("nexopodUser");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    sessionStorage.removeItem("nexopodToken");
    sessionStorage.removeItem("nexopodUser");

    router.replace("/login");
  };

  const isAddStoreActive = pathname === "/dashboard/add-store";
  const isStoresActive = pathname === "/dashboard/stores";

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
    </header>
  );
}
