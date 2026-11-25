"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { useShopOwnerAuthStore } from "@/stores/shopowner/authStore";
import BottomNavigation from "@/components/shopowner/BottomNavigation";

export default function ShopOwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBookingsPage = pathname === "/shopowner/bookings";
  const router = useRouter();
  const logout = useShopOwnerAuthStore((state) => state.logout);

  if (pathname === "/shopowner/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.replace("/shopowner/login");
  };

  return (
    <div className="min-h-screen bg-[#F5F8FA]">
      {/* Top Web Header */}
      {!isBookingsPage && (
        <header className="sticky top-4 z-40 mx-auto mt-4 w-[calc(100%-2rem)] max-w-7xl rounded-full border border-[#E7EDF1] bg-white/95 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
            <Link href="/shopowner/dashboard" className="flex flex-col">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#142D46]">
                Nexo<span className="text-[#00BFA5]">Pod</span>
              </h1>
              <p className="-mt-1 text-xs font-medium text-[#7B8798]">
                Shop Owner Portal
              </p>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.push("/shopowner/notifications")}
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-[#142D46] transition hover:bg-[#E4F7F3] hover:text-[#00BFA5]"
              >
                <Bell size={21} strokeWidth={2} />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 sm:px-4"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Dashboard Content */}
      <main
        className={`mx-auto min-h-[calc(100vh-150px)] w-full max-w-7xl px-4 sm:px-6 lg:px-10 ${
          isBookingsPage ? "pb-32 pt-4 sm:pb-36 sm:pt-6" : "pb-28 pt-6 sm:pt-8"
        }`}
      >
        {children}
      </main>

      <BottomNavigation />
    </div>
  );
}
