         
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Store,
  CalendarDays,
  Eye,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  AlertCircle,
  Clock3,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  getStoreProfileReviewRequests,
  type StoreProfileReviewRequest,
  type StoreProfileReviewListResponse,
} from "@/services/storeProfileReviewService";

type RequestStatus = "all" | "pending" | "approved" | "rejected";

const STATUS_TABS: {
  label: string;
  value: RequestStatus;
  icon: typeof ClipboardList;
}[] = [
  { label: "All Requests", value: "all", icon: ClipboardList },
  { label: "Pending", value: "pending", icon: Clock3 },
  { label: "Approved", value: "approved", icon: CheckCircle2 },
  { label: "Rejected", value: "rejected", icon: XCircle },
];

const PAGE_SIZE = 10;

export default function StoreRequestsPage() {
  const router = useRouter();

  const [activeStatus, setActiveStatus] =
    useState<RequestStatus>("all");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] =
    useState<StoreProfileReviewListResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getStoreProfileReviewRequests({
        status: activeStatus,
        search: debouncedSearch,
        page,
        limit: PAGE_SIZE,
      });

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load store-profile requests."
      );
    } finally {
      setLoading(false);
    }
  }, [activeStatus, debouncedSearch, page]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleStatusChange = (status: RequestStatus) => {
    setActiveStatus(status);
    setPage(1);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRequestedChanges = (
    request: StoreProfileReviewRequest
  ) => {
    const proposed = request.proposedProfile;
    const changes: string[] = [];

    if (proposed.name) changes.push("Store name");
    if (proposed.contactNumber) changes.push("Contact");
    if (proposed.addressLink) changes.push("Address");
    if (proposed.timings) changes.push("Store timings");
    if (proposed.services?.length) changes.push("Services");

    if (proposed.image) changes.push("Main image");

    if (proposed.images?.length) {
      changes.push(`Images (${proposed.images.length})`);
    }

    return changes.length ? changes.join(", ") : "Profile details";
  };

  const statusCounts = data?.statusCounts;

  return (
    <main className="min-h-screen bg-[#f5f9f8] px-4 py-8 text-[#123d4a] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-[#079d98]">
            <ClipboardList size={20} />
            <span className="text-sm font-semibold">
              Store Management
            </span>
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Review Requests
          </h1>

          <p className="mt-2 text-sm text-[#829397]">
            Manage store update requests submitted by shop owners.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">

          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeStatus === tab.value;
              const count = statusCounts?.[tab.value];

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleStatusChange(tab.value)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "border-[#079d98] bg-[#079d98] text-white shadow-sm"
                      : "border-[#e1ebea] bg-white text-[#536b72] hover:border-[#a9dcd5] hover:bg-[#f0faf8]"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                  {count !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#edf4f3] text-[#536b72]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full xl:max-w-xs">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829397]"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by store name or ID..."
              className="w-full rounded-full border border-[#dfe9e7] bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#9aa9aa] focus:border-[#079d98] focus:ring-2 focus:ring-[#079d98]/10"
            />
          </div>
        </div>

        {/* Request Table */}
        <section className="overflow-hidden rounded-2xl border border-[#e3edeb] bg-white shadow-sm">

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#f0f6f5]">
                <tr className="text-xs font-bold text-[#536b72]">
                  <th className="px-6 py-4">Store</th>
                  <th className="px-6 py-4">Requested Changes</th>
                  <th className="px-6 py-4">Requested On</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2f1]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <LoaderCircle
                        size={28}
                        className="mx-auto animate-spin text-[#079d98]"
                      />
                      <p className="mt-3 text-sm text-[#829397]">
                        Loading requests...
                      </p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <AlertCircle
                        size={28}
                        className="mx-auto text-red-500"
                      />
                      <p className="mt-3 text-sm text-red-600">
                        {error}
                      </p>
                      <button
                        type="button"
                        onClick={loadRequests}
                        className="mt-4 rounded-lg bg-[#079d98] px-4 py-2 text-sm font-semibold text-white hover:bg-[#078b86]"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                ) : data?.requests.length ? (
                  data.requests.map((request) => {
                    const storeName =
                      request.storeId?.name || "Unknown Store";

                    return (
                      <tr
                        key={request._id}
                        className="transition hover:bg-[#f9fcfb]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf7f5] text-[#079d98]">
                              <Store size={20} />
                            </div>

                            <div>
                              <p className="font-semibold text-[#123d4a]">
                                {storeName}
                              </p>
                              <p className="mt-1 text-xs text-[#829397]">
                                ID: {request.storeId?._id || "Unavailable"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-[260px] px-6 py-4">
                          <p className="text-sm text-[#536b72]">
                            {getRequestedChanges(request)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#536b72]">
                            <CalendarDays
                              size={16}
                              className="shrink-0 text-[#829397]"
                            />
                            {formatDate(request.createdAt)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={request.status} />
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/dashboard/stores/review/${request._id}`
                              )
                            }
                            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition ${
                              request.status === "pending"
                                ? "bg-[#079d98] text-white hover:bg-[#078b86]"
                                : "border border-[#dce8e6] bg-white text-[#123d4a] hover:border-[#079d98] hover:text-[#079d98]"
                            }`}
                          >
                            <Eye size={15} />
                            {request.status === "pending" ? "Review" : "View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <ClipboardList
                        size={32}
                        className="mx-auto text-[#b4c6c3]"
                      />
                      <p className="mt-3 font-semibold text-[#536b72]">
                        No requests found
                      </p>
                      <p className="mt-1 text-sm text-[#9aa9aa]">
                        Try changing the filters or search term.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !error && data && data.total > 0 && (
            <div className="flex flex-col justify-between gap-3 border-t border-[#edf2f1] px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-sm text-[#829397]">
                Showing{" "}
                <span className="font-semibold text-[#536b72]">
                  {(data.page - 1) * data.limit + 1}
                </span>
                {" "}to{" "}
                <span className="font-semibold text-[#536b72]">
                  {Math.min(data.page * data.limit, data.total)}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-[#536b72]">
                  {data.total}
                </span>
                {" "}requests
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe9e7] text-[#536b72] transition hover:bg-[#eff8f6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="px-2 text-sm font-semibold text-[#536b72]">
                  Page {data.page} of {Math.max(data.totalPages, 1)}
                </span>

                <button
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe9e7] text-[#536b72] transition hover:bg-[#eff8f6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const styles = {
    pending: "bg-orange-50 text-orange-600",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-600",
  };

  const labels = {
    pending: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
  };

  const icons = {
    pending: Clock3,
    approved: CheckCircle2,
    rejected: XCircle,
  };

  const Icon = icons[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${styles[status]}`}
    >
      <Icon size={14} />
      {labels[status]}
    </span>
  );
}
