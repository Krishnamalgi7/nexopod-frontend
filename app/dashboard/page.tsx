"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Plus,
    Store,
    Activity,
    PauseCircle,
    LoaderCircle,
    AlertCircle
} from "lucide-react";
import { getStoreStats, type StoreStats } from "@/services/storeService";

export default function DashboardPage() {
    const [stats, setStats] = useState<StoreStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await getStoreStats();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load stats");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <main className="min-h-screen bg-[#f4f9f8] text-[#123d4a]">
            <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
                
                {/* Welcome section */}
                <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#079d98]">
                            Your workspace
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#123d4a] sm:text-4xl">
                            Welcome to NexoPod
                        </h1>
                        <p className="mt-3 text-sm text-[#70858a] sm:text-base">
                            Manage your stores and keep everything organised.
                        </p>
                    </div>
                </section>

                {/* Stats section */}
                <section className="mt-12 sm:mt-14">
                    <div className="mb-6 flex flex-col justify-between gap-3 border-b border-[#dfebea] pb-5 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-[#123d4a]">
                                Overview
                            </h2>
                            <p className="mt-1 text-sm text-[#829397]">
                                Quick statistics about your business.
                            </p>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-[#e3edeb] bg-white">
                            <LoaderCircle size={28} className="animate-spin text-[#079d98]" />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
                            <AlertCircle size={28} className="mb-2" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {!loading && !error && stats && (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                            {/* Total Stores Card */}
                            <div className="rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3 text-[#536b72]">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf8f6] text-[#079d98]">
                                        <Store size={20} />
                                    </div>
                                    <h3 className="font-semibold">Total Stores</h3>
                                </div>
                                <p className="mt-4 text-3xl font-bold text-[#123d4a]">{stats.totalStores}</p>
                            </div>

                            {/* Active Stores Card */}
                            <div className="rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3 text-[#536b72]">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                                        <Activity size={20} />
                                    </div>
                                    <h3 className="font-semibold">Active Stores</h3>
                                </div>
                                <p className="mt-4 text-3xl font-bold text-[#123d4a]">{stats.activeStores}</p>
                            </div>

                            {/* Inactive Stores Card */}
                            <div className="rounded-2xl border border-[#e3edeb] bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3 text-[#536b72]">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
                                        <PauseCircle size={20} />
                                    </div>
                                    <h3 className="font-semibold">Inactive Stores</h3>
                                </div>
                                <p className="mt-4 text-3xl font-bold text-[#123d4a]">{stats.inactiveStores}</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer className="mt-16 flex flex-col items-center justify-between gap-2 border-t border-[#dfebea] py-6 text-xs text-[#829397] sm:flex-row">
                    <span className="font-semibold text-[#087d7b]">
                        NexoPod
                    </span>
                    <span>Manage your business in one place.</span>
                </footer>
            </div>
        </main>
    );
}