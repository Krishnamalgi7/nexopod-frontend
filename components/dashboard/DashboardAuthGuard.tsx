"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  connectSuperAdminSocket,
  disconnectSuperAdminSocket,
} from "@/services/socket";
import Navbar from "@/components/dashboard/Navbar";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const isHydrated = useAuthStore((state) => state.isHydrated);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !token) {
      return;
    }

    const socket = connectSuperAdminSocket(token);

    socket.on("connect", () => {
      console.log("Super Admin socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Super Admin socket connection error:", error.message);
    });

    socket.on("store_profile_change_requested", (notification) => {
      console.log("New store profile change request:", notification);

      window.dispatchEvent(new Event("store-profile-notification-refresh"));
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("store_profile_change_requested");
      disconnectSuperAdminSocket();
    };
  }, [isHydrated, isAuthenticated, token]);

  if (!isHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div>{children}</div>
    </>
  );
}
