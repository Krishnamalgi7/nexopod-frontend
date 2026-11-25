"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, UserRound } from "lucide-react";

const navigation = [
  {
    label: "Home",
    href: "/shopowner/dashboard",
    icon: Home,
  },
  {
    label: "Bookings",
    href: "/shopowner/bookings",
    icon: CalendarDays,
  },
  {
    label: "Profile",
    href: "/shopowner/profile",
    icon: UserRound,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 rounded-full border border-white bg-white/95 p-1.5 shadow-[0_8px_30px_rgba(20,45,70,0.12)] backdrop-blur-xl">
      <div className="flex h-[62px] w-full items-center justify-around">
        {navigation.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-[48px] min-w-[76px] flex-col items-center justify-center gap-0.5 rounded-full px-5 transition-all duration-200 sm:min-w-[100px] sm:px-7 ${
                active
                  ? "bg-[#E4F7F3] text-[#00BFA5]"
                  : "text-[#7B8798] hover:bg-[#F5F8FA] hover:text-[#142D46]"
              }`}
            >
              <Icon size={23} strokeWidth={active ? 2.5 : 2} />
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
