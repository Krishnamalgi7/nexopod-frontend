
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Store,
    Plus,
    MapPin,
    Phone,
    ExternalLink,
    RefreshCw,
    LoaderCircle,
    ImageOff,
} from "lucide-react";

import { getStores, type StoreItem } from "@/services/storeService";
import API_BASE_URL from "@/services/api";

export default function StoresPage() {
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStores = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getStores();
            setStores(response.data);
        } catch (err) {
            console.error("Failed to load stores:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load stores."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    return (
        <main className="min-h-screen bg-[#f4f9f8] px-4 py-8 sm:px-6">
            <div className="mx-auto w-full max-w-7xl">

                {/* Page heading */}
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-[#079d98]">
                            <Store size={19} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                Store management
                            </span>
                        </div>

                        <h1 className="mt-3 text-3xl font-bold text-[#123d4a]">
                            Your Stores
                        </h1>

                        <p className="mt-2 text-sm text-[#70858a]">
                            View and manage all your registered store locations.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={fetchStores}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 rounded-xl border border-[#dce9e6] bg-white px-4 py-3 text-sm font-semibold text-[#536b72] hover:bg-[#eaf8f6] disabled:opacity-60"
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>

                        <Link
                            href="/dashboard/add-store"
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#079d98] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#078b86]"
                        >
                            <Plus size={18} />
                            Add Store
                        </Link>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-[#e3edeb] bg-white">
                        <LoaderCircle
                            size={34}
                            className="animate-spin text-[#079d98]"
                        />
                        <p className="mt-4 text-sm font-medium text-[#70858a]">
                            Loading your stores...
                        </p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
                        <p className="font-semibold text-red-600">
                            Unable to load stores
                        </p>

                        <p className="mt-2 text-sm text-[#70858a]">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={fetchStores}
                            className="mt-5 rounded-xl bg-[#079d98] px-5 py-3 text-sm font-semibold text-white hover:bg-[#078b86]"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && stores.length === 0 && (
                    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-[#e3edeb] bg-white px-5 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf8f6] text-[#079d98]">
                            <MapPin size={30} />
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-[#123d4a]">
                            No stores found
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-6 text-[#70858a]">
                            You haven't added any stores yet. Add your first
                            store to see it listed here.
                        </p>

                        <Link
                            href="/dashboard/add-store"
                            className="mt-6 flex items-center gap-2 rounded-xl bg-[#079d98] px-5 py-3 text-sm font-semibold text-white hover:bg-[#078b86]"
                        >
                            <Plus size={18} />
                            Add Your First Store
                        </Link>
                    </div>
                )}

                {/* Store cards */}
                {!loading && !error && stores.length > 0 && (
                    <>
                        <div className="mb-5 flex items-center justify-between border-b border-[#dce9e6] pb-4">
                            <div>
                                <h2 className="font-bold text-[#123d4a]">
                                    All Locations
                                </h2>
                                <p className="mt-1 text-sm text-[#70858a]">
                                    Your registered store locations.
                                </p>
                            </div>

                            <span className="rounded-full bg-[#e3f5f2] px-4 py-2 text-sm font-semibold text-[#087d7b]">
                                {stores.length} {stores.length === 1 ? "Store" : "Stores"}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {stores.map((store) => (
                                <article
                                    key={store._id}
                                    className="overflow-hidden rounded-2xl border border-[#e3edeb] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                    {/* Main image */}
                                    <div className="relative h-52 bg-[#eaf3f1]">
                                        {store.image?.path ? (
                                            <img
                                                src={`${API_BASE_URL}${store.image.path}`}
                                                alt={store.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-[#079d98]">
                                                <ImageOff size={36} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="p-5">
                                        <h3 className="truncate text-lg font-bold text-[#123d4a]">
                                            {store.name}
                                        </h3>

                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-[#70858a]">
                                                <Phone
                                                    size={17}
                                                    className="shrink-0 text-[#079d98]"
                                                />
                                                <span>
                                                    +91 {store.contactNumber}
                                                </span>
                                            </div>

                                            <a
                                                href={store.addressLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 text-sm font-medium text-[#079d98] hover:underline"
                                            >
                                                <MapPin size={17} className="shrink-0" />
                                                View Google Maps location
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>

                                        {store.images?.length > 0 && (
                                            <p className="mt-4 border-t border-[#edf2f1] pt-3 text-xs text-[#829397]">
                                                {store.images.length} additional{" "}
                                                {store.images.length === 1 ? "image" : "images"}
                                            </p>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
