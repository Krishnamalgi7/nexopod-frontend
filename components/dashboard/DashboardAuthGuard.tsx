
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/dashboard/Navbar";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardAuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const isHydrated = useAuthStore((state) => state.isHydrated);
    const isAuthenticated = useAuthStore(
        (state) => state.isAuthenticated
    );
    const hydrateSession = useAuthStore(
        (state) => state.hydrateSession
    );

    useEffect(() => {
        hydrateSession();
    }, [hydrateSession]);

    useEffect(() => {
        if (isHydrated && !isAuthenticated) {
            router.replace("/login");
        }
    }, [isHydrated, isAuthenticated, router]);

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
