
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import API_BASE_URL from "@/services/common/api";
import ImageWithFallback from "@/components/common/ImageWithFallback";

interface StoreImage {
  type: string;
  path: string;
}

interface StoreItem {
  _id: string;
  name: string;
  addressLink?: string;
  services: string[];
  image?: StoreImage;
  images?: StoreImage[];
}

interface Pagination {
  totalStores: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const serviceFilters = [
  { label: "All", value: "all" },
  { label: "Phone Charging", value: "Phone Charging" },
  { label: "Pick Me Later", value: "Pick Me Later" },
];

const getImageUrl = (image?: StoreImage) => {
  if (!image?.path) return undefined;

  return image.path.startsWith("http")
    ? image.path
    : `${API_BASE_URL}${image.path}`;
};

export default function AllStoresPage() {
  const router = useRouter();

  const [stores, setStores] = useState<StoreItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("all");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          search: searchQuery.trim(),
          service: selectedService,
          page: String(page),
          limit: "10",
        });

        const response = await fetch(
          `${API_BASE_URL}/api/public/stores?${params.toString()}`,
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to fetch stores.");
        }

        if (!cancelled) {
          setStores(result.data || []);
          setPagination(result.pagination || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load stores. Please try again.",
          );
          setStores([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedService, page]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleServiceFilter = (service: string) => {
    setSelectedService(service);
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-[#F5F8FA] px-5 pb-10 pt-5 text-[#142D46] sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl">

        {/* Header */}
        <header className="flex items-center gap-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-[#E4F7F3]"
          >
            <ArrowLeft size={25} />
          </button>

          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              All Stores
            </h1>
            <p className="mt-1 text-sm text-[#7B8798] sm:text-base">
              Discover stores and services
            </p>
          </div>
        </header>

        {/* Search */}
        <div className="mt-8 flex h-[58px] items-center gap-3 rounded-2xl border border-[#E7EDF1] bg-white px-5 shadow-sm">
          <Search size={23} className="shrink-0 text-[#7B8798]" />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search stores..."
            className="h-full w-full bg-transparent text-base text-[#142D46] outline-none placeholder:text-[#9AA5B1]"
          />
        </div>

        {/* Service Filters */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <SlidersHorizontal size={23} className="text-[#164653]" />
            <h2 className="text-lg font-bold">
              Filter by Service
            </h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {serviceFilters.map((service) => {
              const active = selectedService === service.value;

              return (
                <button
                  key={service.value}
                  type="button"
                  onClick={() => handleServiceFilter(service.value)}
                  className={`shrink-0 rounded-full border px-6 py-3 text-sm font-semibold transition ${
                    active
                      ? "border-[#00BFA5] bg-[#00BFA5] text-white"
                      : "border-[#E7EDF1] bg-white text-[#142D46] hover:border-[#00BFA5]"
                  }`}
                >
                  {service.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Store Results */}
        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold sm:text-2xl">
              Explore Stores
            </h2>

            <span className="text-sm font-medium text-[#7B8798]">
              {pagination?.totalStores ?? 0} Stores
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#E4F7F3] border-t-[#00BFA5]" />
              <p className="mt-4 text-sm text-[#7B8798]">
                Finding stores...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                type="button"
                onClick={() => setPage((current) => current)}
                className="mt-3 font-semibold text-[#00BFA5]"
              >
                Try again
              </button>
            </div>
          ) : stores.length === 0 ? (
            <div className="rounded-2xl border border-[#E7EDF1] bg-white px-5 py-14 text-center">
              <MapPin size={38} className="mx-auto text-[#00BFA5]" />
              <h3 className="mt-4 text-lg font-bold">
                No stores found
              </h3>
              <p className="mt-2 text-sm text-[#7B8798]">
                Try another search or service filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {stores.map((store) => (
                <button
                  key={store._id}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/customer/store-details?storeId=${store._id}`,
                    )
                  }
                  className="group overflow-hidden rounded-[22px] border border-[#E7EDF1] bg-white text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <ImageWithFallback
                    src={getImageUrl(store.image)}
                    alt={store.name}
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-[#142D46]">
                      {store.name}
                    </h3>

                    <p className="mb-3 mt-4 text-sm font-medium text-[#7B8798]">
                      Available Services
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {store.services?.map((service) => (
                        <span
                          key={service}
                          className="rounded-full bg-[#E4F7F3] px-4 py-2 text-xs font-semibold text-[#164653]"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination && pagination.totalStores > 0 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((current) => current - 1)}
                className="flex items-center gap-2 rounded-xl border border-[#E7EDF1] bg-white px-4 py-3 text-sm font-semibold disabled:opacity-40"
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <span className="text-sm font-semibold">
                {pagination.currentPage} / {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
                className="flex items-center gap-2 rounded-xl border border-[#E7EDF1] bg-white px-4 py-3 text-sm font-semibold disabled:opacity-40"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
