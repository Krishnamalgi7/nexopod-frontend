
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  ScanQrCode,
  UserRound,
} from "lucide-react";

const navigation = [
  {
    label: "Home",
    href: "/customer/home",
    icon: Home,
  },
  {
    label: "Bookings",
    href: "/customer/bookings",
    icon: CalendarDays,
  },
  {
    label: "QR Scanner",
    href: null,
    icon: ScanQrCode,
  },
  {
    label: "Profile",
    href: "/customer/profile",
    icon: UserRound,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 rounded-full border border-white/80 bg-white/95 p-2 shadow-[0_8px_30px_rgba(20,45,70,0.16)] backdrop-blur-xl">
      <div className="flex h-[64px] w-full items-center justify-around">
        {navigation.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          const className = [
            "flex h-[50px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 transition-all duration-200",
            active
              ? "bg-[#E4F7F3] text-[#00BFA5]"
              : "text-[#7B8798] hover:bg-[#F5F8FA] hover:text-[#142D46]",
          ].join(" ");

          if (!item.href) {
            return (
              <button
                key={item.label}
                type="button"
                disabled
                title="QR Scanner coming soon"
                className={`${className} cursor-not-allowed opacity-60`}
              >
                <Icon size={23} strokeWidth={2} />
                <span className="whitespace-nowrap text-[11px] font-semibold sm:text-xs">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={className}
            >
              <Icon size={23} strokeWidth={active ? 2.5 : 2} />
              <span className="whitespace-nowrap text-[11px] font-semibold sm:text-xs">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
