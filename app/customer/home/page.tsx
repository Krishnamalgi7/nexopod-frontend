"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import API_BASE_URL from "@/services/common/api";

interface StoreItem {
  _id: string;
  name: string;
  addressLink?: string;
  services: string[];
  image?: unknown;
  images?: unknown[];
}

const serviceFilters = ["All Services", "Phone Charging", "Pick Me Later"];

const carouselImages = [
  "/caresoul1.png",
  "/caresoul2.png",
  "/caresoul3.png",
  "/caresoul4.png",
];

const getImageUri = (image: unknown): string | undefined => {
  if (typeof image === "string") {
    return image.startsWith("http") ? image : `${API_BASE_URL}${image}`;
  }

  if (image && typeof image === "object") {
    const item = image as Record<string, unknown>;
    const uri = item.path || item.url || item.uri || item.secure_url;

    if (typeof uri === "string") {
      return uri.startsWith("http") ? uri : `${API_BASE_URL}${uri}`;
    }
  }

  return undefined;
};

export default function UserHomePage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedService, setSelectedService] = useState("All Services");
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchStores = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/stores?limit=10`,
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setStores(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % carouselImages.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchesSearch = store.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesService =
        selectedService === "All Services" ||
        store.services?.includes(selectedService);

      return matchesSearch && matchesService;
    });
  }, [stores, searchQuery, selectedService]);

  const goToAllStores = () => {
    router.push("/customer/all-stores");
  };

  const goToStoreDetails = (storeId: string) => {
    router.push(
      `/customer/store-details?storeId=${encodeURIComponent(storeId)}`,
    );
  };

  const changeSlide = (direction: number) => {
    setActiveSlide(
      (current) =>
        (current + direction + carouselImages.length) % carouselImages.length,
    );
  };

  return (
    <main className="min-h-screen bg-[#F5F8FA]">
      {/* Floating Top Navbar */}
      <header className="relative mx-auto mt-4 w-[calc(100%-2rem)] max-w-7xl rounded-full border border-[#E7EDF1] bg-white/95 shadow-sm">
        <div className="flex h-[70px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#142D46]">
              Nexo<span className="text-[#00BFA5]">Pod</span>
            </h1>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-[#142D46] transition hover:bg-[#E4F7F3] hover:text-[#00BFA5]"
          >
            <Bell size={21} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        {/* Welcome */}
        <section className="mb-7">
          <h2 className="text-3xl font-bold text-[#142D46]">
            Welcome to Nexopod !
          </h2>
        </section>

        {/* Search and filter */}
        <section className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex h-14 flex-1 items-center rounded-2xl border border-[#E7EDF1] bg-white px-4 shadow-sm transition focus-within:border-[#00BFA5]">
            {" "}
            <Search size={21} className="shrink-0 text-[#7B8798]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search stores near you..."
              className="ml-3 h-full w-full bg-transparent py-3 text-sm text-[#142D46] outline-none placeholder:text-[#9AA5B1]"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterVisible(true)}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#00BFA5] px-7 font-semibold text-white shadow-sm transition hover:bg-[#00A995]"
          >
            <SlidersHorizontal size={19} />
            Filter Stores
          </button>
        </section>

        {/* Location text */}
        <div className="mb-7 flex items-center gap-2 text-sm text-[#7B8798]">
          <MapPin size={17} className="text-[#00BFA5]" />
          Discover stores around you
        </div>

        {/* Promotional carousel */}
        <section className="relative mb-12 overflow-hidden rounded-3xl">
          <div className="relative h-[190px] overflow-hidden rounded-3xl bg-[#E4F7F3] sm:h-[230px] lg:mx-auto lg:aspect-[3/1] lg:h-auto lg:max-w-5xl">
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${activeSlide * 100}%)`,
              }}
            >
              {carouselImages.map((image, index) => (
                <div key={image} className="h-full w-full shrink-0">
                  <img
                    src={image}
                    alt={`NexoPod promotion ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => changeSlide(-1)}
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#164653] shadow-md transition hover:bg-white"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              aria-label="Next slide"
              onClick={() => changeSlide(1)}
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#164653] shadow-md transition hover:bg-white"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            {carouselImages.map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  activeSlide === index
                    ? "w-7 bg-[#00BFA5]"
                    : "w-2 bg-[#C9D6D8]"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Nearby stores */}
        <section className="pb-12">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold text-[#142D46]">
                Nearby Stores
              </h2>
              <p className="mt-1 text-sm text-[#7B8798]">
                Explore stores and their available services
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-[#00A995]">
                {filteredStores.length} stores
              </span>
              <button
                type="button"
                onClick={goToAllStores}
                className="flex items-center gap-1 text-sm font-bold text-[#00A995] transition hover:text-[#008F75]"
              >
                View More
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {storesLoading ? (
            <div className="rounded-2xl border border-[#E7EDF1] bg-white py-12 text-center text-sm text-[#7B8798]">
              Finding stores for you...
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="rounded-2xl border border-[#E7EDF1] bg-white py-12 text-center text-sm text-[#7B8798]">
              No stores found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredStores.map((store) => {
                const storeImage =
                  getImageUri(store.image) || getImageUri(store.images?.[0]);

                return (
                  <button
                    key={store._id}
                    type="button"
                    onClick={() => goToStoreDetails(store._id)}
                    className="group overflow-hidden rounded-2xl border border-[#E7EDF1] bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="h-48 overflow-hidden bg-[#E4F7F3]">
                      {storeImage ? (
                        <img
                          src={storeImage}
                          alt={store.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MapPin size={36} className="text-[#00BFA5]" />
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="truncate text-lg font-bold text-[#142D46]">
                        {store.name}
                      </h3>

                      <p className="mt-3 text-xs font-semibold text-[#7B8798]">
                        Available Services
                      </p>

                      <div className="mt-2 flex min-h-8 flex-wrap gap-2">
                        {store.services?.length ? (
                          store.services.map((service) => (
                            <span
                              key={service}
                              className="rounded-full bg-[#E4F7F3] px-3 py-1.5 text-xs font-medium text-[#164653]"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#9AA5B1]">
                            No services listed
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-center justify-end border-t border-[#E7EDF1] pt-3 text-sm font-semibold text-[#00A995]">
                        View Store
                        <ChevronRight size={17} className="ml-1" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={goToAllStores}
              className="flex items-center gap-2 rounded-xl  px-7 py-3 text-sm font-bold text-[#00A995] transition hover:bg-[#E4F7F3]"
            >
              View More Stores
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </div>

      {/* Service filter modal */}
      {filterVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#142D46]/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setFilterVisible(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#142D46]">
                Filter Stores
              </h2>

              <button
                type="button"
                aria-label="Close filter"
                onClick={() => setFilterVisible(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F8FA] text-[#7B8798] hover:bg-[#E4F7F3]"
              >
                <X size={19} />
              </button>
            </div>

            <p className="mb-5 text-sm text-[#7B8798]">
              Choose a service to discover matching stores.
            </p>

            <div className="space-y-3">
              {serviceFilters.map((service) => {
                const active = selectedService === service;

                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-[#00BFA5] bg-[#E4F7F3]"
                        : "border-[#E7EDF1] bg-white hover:bg-[#F8FBFC]"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        active ? "text-[#008F75]" : "text-[#142D46]"
                      }`}
                    >
                      {service}
                    </span>

                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        active
                          ? "border-[#00A995] bg-[#00A995]"
                          : "border-[#CBD5E1]"
                      }`}
                    >
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedService("All Services")}
                className="h-12 flex-1 rounded-xl border border-[#E7EDF1] font-bold text-[#64748B] transition hover:bg-[#F5F8FA]"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => setFilterVisible(false)}
                className="h-12 flex-1 rounded-xl bg-[#00A995] font-bold text-white transition hover:bg-[#008F75]"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
