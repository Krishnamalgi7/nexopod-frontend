"use client";
import { jsPDF } from "jspdf";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Download,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Pencil,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Store as StoreIcon,
  X,
} from "lucide-react";

import API_BASE_URL from "@/services/common/api";
import { useShopOwnerAuthStore } from "@/stores/shopowner/authStore";

interface DayTiming {
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
}

interface StoreImage {
  type: string;
  path: string;
}

type StoreService = "Phone Charging" | "Pick Me Later";

interface StoreData {
  name: string;
  address: string;
  storeCode: string;
  qrImage: string;
  addressLink: string;
  contactNumber: string;
  timings: string;
  services: StoreService[];
  weeklyTimings: Record<string, DayTiming>;
  image: StoreImage;
  images: StoreImage[];
  isActive: boolean;
  createdAt: string;
}

interface ProfileRequest {
  _id: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt?: string;
  reviewedAt?: string;
  proposedProfile?: {
    isActive?: boolean;
  };
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ShopOwnerProfilePage() {
  const router = useRouter();
  const token = useShopOwnerAuthStore((state) => state.token);
  const logout = useShopOwnerAuthStore((state) => state.logout);

  const [store, setStore] = useState<StoreData | null>(null);
  const [profileRequest, setProfileRequest] = useState<ProfileRequest | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  // Edit Store Profile
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContactNumber, setEditContactNumber] = useState("");
  const [editAddressLink, setEditAddressLink] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [editServices, setEditServices] = useState<StoreService[]>([]);
  const [editWeeklyTimings, setEditWeeklyTimings] = useState<
    Record<string, DayTiming>
  >({});

  const [selectedMainImage, setSelectedMainImage] = useState<File | null>(null);
  const [keepExistingMainImage, setKeepExistingMainImage] = useState(true);

  const [existingGalleryImages, setExistingGalleryImages] = useState<
    StoreImage[]
  >([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<File[]>(
    [],
  );
  const [profileRequestNoticeVisible, setProfileRequestNoticeVisible] =
    useState(false);
  const [error, setError] = useState("");

  // Fetch approved store profile
  const fetchProfile = useCallback(async () => {
    if (!token) {
      router.replace("/shopowner/login");
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/shop-owners/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        logout();
        router.replace("/shopowner/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to fetch store details.");
      }

      setStore(result.data.store);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, logout, router]);

  // Fetch latest profile change request
  const fetchProfileRequestStatus = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/profile-change-request/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401 || response.status === 403) {
        logout();
        router.replace("/shopowner/login");
        return;
      }

      if (!response.ok) return;

      const result = await response.json();

      if (result.success) {
        setProfileRequest(result.data.request || null);
      }
    } catch (err) {
      console.error("Unable to fetch profile request status:", err);
    }
  }, [token, logout, router]);

  useEffect(() => {
    fetchProfile();
    fetchProfileRequestStatus();
  }, [fetchProfile, fetchProfileRequestStatus]);

  // Restore profile request notification visibility
  useEffect(() => {
    if (!profileRequest || profileRequest.status === "pending") return;

    const dismissed = localStorage.getItem(
      `dismissedProfileRequest_${profileRequest._id}`,
    );

    setProfileRequestNoticeVisible(dismissed !== "true");
  }, [profileRequest]);

  // Refresh profile
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchProfileRequestStatus()]);
  };

  // Image URL
  const getImageUrl = (image?: StoreImage) => {
    if (!image?.path) return null;
    return `${API_BASE_URL}${image.path}`;
  };

  // Store QR image URL
  const getQrImageUrl = () => {
    if (!store?.qrImage) return null;
    return `${API_BASE_URL}${store.qrImage}`;
  };

  const handleDownloadQrPng = async () => {
    const imageUrl = getQrImageUrl();
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Failed to download QR code.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${store?.name || "store"}-qr.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("QR PNG download failed:", error);
      alert("Unable to download QR code. Please try again.");
    }
  };

  const handleDownloadQrPdf = async () => {
    const imageUrl = getQrImageUrl();
    if (!imageUrl || !store) return;

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch QR image.");
      }

      const blob = await response.blob();

      const qrDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Unable to process QR image."));
          }
        };

        reader.onerror = () => reject(new Error("Unable to read QR image."));
        reader.readAsDataURL(blob);
      });

      const pdf = new jsPDF("p", "mm", "a4");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(20, 45, 70);
      pdf.text("NexoPod", 105, 35, { align: "center" });

      pdf.setFontSize(19);
      pdf.text(store.name, 105, 55, { align: "center" });

      pdf.addImage(qrDataUrl, "PNG", 55, 75, 100, 100);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(0, 143, 117);
      pdf.text("Scan to explore services and book", 105, 195, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Your permanent store QR code", 105, 207, {
        align: "center",
      });

      pdf.setFontSize(10);
      pdf.text(`Store Code: ${store.storeCode}`, 105, 220, {
        align: "center",
      });

      pdf.save(`${store.name}-qr-poster.pdf`);
    } catch (error) {
      console.error("QR PDF download failed:", error);
      alert("Unable to generate PDF. Please try again.");
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    router.replace("/shopowner/login");
  };

  const toTimeInputValue = (value?: string) => {
    if (!value) return "09:00";

    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return "09:00";

    let hours = Number(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  };

  const toStoredTimeValue = (value: string) => {
    const [hourString, minutes] = value.split(":");
    const hour = Number(hourString);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${period}`;
  };

  const openEditModal = () => {
    if (!store) return;

    setEditName(store.name);
    setEditAddress(store.address || "");
    setEditContactNumber(
      store.contactNumber.replace(/^\+91/, "").replace(/\D/g, "").slice(-10),
    );
    setEditAddressLink(store.addressLink);
    setEditServices(store.services?.length ? [...store.services] : []);

    setEditWeeklyTimings(
      Object.fromEntries(
        DAYS.map((day) => {
          const dayKey = day.toLowerCase();
          const timing = store.weeklyTimings?.[dayKey];

          return [dayKey, timing ? { ...timing } : { isClosed: true }];
        }),
      ),
    );

    setSelectedMainImage(null);
    setKeepExistingMainImage(!!store.image?.path);
    setExistingGalleryImages(store.images || []);
    setSelectedGalleryImages([]);

    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!store) return;

    if (!editName.trim()) {
      setError("Store name is required.");
      return;
    }

    if (editName.trim().length < 2 || editName.trim().length > 100) {
      setError("Store name must be between 2 and 100 characters.");
      return;
    }

    if (!/^\d{10}$/.test(editContactNumber.trim())) {
      setError("Enter a valid 10-digit contact number.");
      return;
    }

    if (!editAddressLink.trim()) {
      setError("Google Maps link is required.");
      return;
    }

    if (editAddress.trim().length < 5) {
      setError("Please enter a valid physical store address.");
      return;
    }

    if (editServices.length === 0) {
      setError("At least one store service must remain enabled.");
      return;
    }

    if (!selectedMainImage && !keepExistingMainImage) {
      setError("Please select a main store image.");
      return;
    }

    if (existingGalleryImages.length + selectedGalleryImages.length > 4) {
      setError("You can add a maximum of 4 gallery images.");
      return;
    }

    for (const [day, timing] of Object.entries(editWeeklyTimings)) {
      if (!timing.isClosed && (!timing.openTime || !timing.closeTime)) {
        setError(`Please select opening and closing times for ${day}.`);
        return;
      }
    }

    try {
      setSavingProfile(true);
      setError("");

      if (!token) {
        logout();
        router.replace("/shopowner/login");
        return;
      }

      const formData = new FormData();

      formData.append("name", editName.trim());
      formData.append("address", editAddress.trim());
      formData.append("contactNumber", editContactNumber.trim());
      formData.append("addressLink", editAddressLink.trim());
      formData.append("services", JSON.stringify(editServices));
      formData.append("weeklyTimings", JSON.stringify(editWeeklyTimings));
      formData.append(
        "existingImages",
        JSON.stringify(existingGalleryImages.map((image) => image.path)),
      );

      if (!selectedMainImage && keepExistingMainImage && store.image?.path) {
        formData.append("mainImagePath", store.image.path);
      }

      if (selectedMainImage) {
        formData.append("image", selectedMainImage);
      }

      selectedGalleryImages.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch(
        `${API_BASE_URL}/api/shop-owners/profile-change-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        logout();
        router.replace("/shopowner/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit profile change request.",
        );
      }

      setEditVisible(false);
      setSelectedMainImage(null);
      setSelectedGalleryImages([]);
      await fetchProfileRequestStatus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit profile change request.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="animate-spin text-[#00BFA5]" size={32} />
        <p className="text-sm text-[#7B8798]">Loading profile...</p>
      </div>
    );
  }

  // Missing profile state
  if (!store) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl bg-white p-8 text-center">
        <StoreIcon size={36} className="text-[#7B8798]" />
        <p className="text-sm text-[#64748B]">
          {error || "Store details are unavailable."}
        </p>
        <button
          onClick={fetchProfile}
          className="rounded-xl bg-[#164653] px-5 py-3 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-8">
      {/* Profile Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#142D46]">My Profile</h1>
          <p className="mt-1 text-sm text-[#7B8798]">
            Manage your store information
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh profile"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#00BFA5] shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile Request Status */}
      {profileRequest &&
        (profileRequest.status === "pending" ||
          profileRequestNoticeVisible) && (
          <div
            className={`relative rounded-xl border p-4 ${
              profileRequest.status === "pending"
                ? "border-amber-200 bg-amber-50"
                : profileRequest.status === "approved"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
            }`}
          >
            <p className="text-sm font-bold">
              {profileRequest.proposedProfile?.isActive === false
                ? profileRequest.status === "pending"
                  ? "Deactivation Request Pending"
                  : profileRequest.status === "approved"
                    ? "Deactivation Approved"
                    : "Deactivation Request Rejected"
                : profileRequest.proposedProfile?.isActive === true
                  ? profileRequest.status === "pending"
                    ? "Reactivation Request Pending"
                    : profileRequest.status === "approved"
                      ? "Reactivation Approved"
                      : "Reactivation Request Rejected"
                  : profileRequest.status === "pending"
                    ? "Profile Changes Awaiting Approval"
                    : profileRequest.status === "approved"
                      ? "Profile Changes Approved"
                      : "Profile Changes Rejected"}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              {profileRequest.proposedProfile?.isActive === false
                ? profileRequest.status === "pending"
                  ? "Your store will remain active until the Super Admin approves deactivation."
                  : profileRequest.status === "approved"
                    ? "Your store deactivation has been approved."
                    : "Your store remains active because the deactivation request was rejected."
                : profileRequest.proposedProfile?.isActive === true
                  ? profileRequest.status === "pending"
                    ? "Your store will remain inactive until the Super Admin approves reactivation."
                    : profileRequest.status === "approved"
                      ? "Your store reactivation has been approved."
                      : "Your store remains inactive because the reactivation request was rejected."
                  : profileRequest.status === "pending"
                    ? "Your submitted changes are being reviewed. Your current approved profile remains visible until approval."
                    : profileRequest.status === "approved"
                      ? "Your requested store profile changes have been approved."
                      : "Your requested changes were not approved."}
            </p>

            {profileRequest.status === "rejected" &&
              profileRequest.rejectionReason && (
                <p className="mt-2 text-xs font-medium text-red-700">
                  Reason: {profileRequest.rejectionReason}
                </p>
              )}
            {profileRequest.status !== "pending" && (
              <button
                onClick={() => {
                  setProfileRequestNoticeVisible(false);
                  localStorage.setItem(
                    `dismissedProfileRequest_${profileRequest._id}`,
                    "true",
                  );
                }}
                className="absolute right-3 top-3 text-sm text-[#64748B]"
                aria-label="Close notification"
              >
                ✕
              </button>
            )}
          </div>
        )}

      {/* Main Store Profile Card */}
      <section className="rounded-2xl border border-[#E7EDF1] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {store.image?.path ? (
            <img
              src={getImageUrl(store.image) || ""}
              alt={store.name}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3]">
              <StoreIcon size={30} className="text-[#164653]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#123D4A]">{store.name}</h2>
            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                store.isActive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {store.isActive ? "Active Store" : "Inactive Store"}
            </span>
          </div>

          <button
            type="button"
            disabled={!store.isActive || profileRequest?.status === "pending"}
            onClick={openEditModal}
            title="Edit Store Profile"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              store.isActive
                ? "bg-[#E4F7F3] text-[#008F75]"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <Pencil size={18} />
          </button>
        </div>

        {!store.isActive && (
          <div className="mt-5">
            <p className="mb-3 text-sm leading-5 text-red-600">
              Your store is currently inactive. Submit a reactivation request to
              the Super Admin to restore access to store operations.
            </p>

            {profileRequest?.status === "pending" &&
            profileRequest.proposedProfile?.isActive === true ? (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-800">
                Reactivation Request Pending
              </div>
            ) : (
              <button
                type="button"
                disabled={savingProfile}
                onClick={async () => {
                  setSavingProfile(true);
                  try {
                    const response = await fetch(
                      `${API_BASE_URL}/api/shop-owners/profile-change-request`,
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ isActive: true }),
                      },
                    );
                    const result = await response.json();
                    if (!response.ok || !result.success) {
                      throw new Error(
                        result.message || "Unable to request reactivation.",
                      );
                    }
                    await fetchProfileRequestStatus();
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Unable to request reactivation.",
                    );
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#008F75] text-sm font-bold text-white disabled:opacity-50"
              >
                {savingProfile ? "Submitting..." : "Request Store Reactivation"}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Store Information */}
      <section className="rounded-2xl border border-[#E7EDF1] bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-[#123D4A]">
          Store Information
        </h2>

        {/* Contact Number */}
        <div className="flex items-center gap-3 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3]">
            <Phone size={19} className="text-[#00A985]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Contact Number</p>
            <p className="mt-1 font-semibold text-gray-800">
              {store.contactNumber
                ? `+91 | ${store.contactNumber}`
                : "Not specified"}
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Store Location */}
        <div className="flex items-center gap-3 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3]">
            <MapPin size={19} className="text-[#00A985]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Store Location</p>
            {store.addressLink ? (
              <a
                href={store.addressLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex rounded-2xl bg-[#E4F7F3] px-3 py-2 text-sm font-medium text-[#008F75]"
              >
                View on Google Maps
              </a>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Not specified</p>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Weekly Schedule */}
        <div className="flex items-center gap-3 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3]">
            <Clock size={19} className="text-[#00A985]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">
              Tap below to see Store Timings
            </p>
            <button
              type="button"
              onClick={() => setScheduleVisible(true)}
              className="mt-2 rounded-2xl bg-[#E4F7F3] px-3 py-2 text-sm font-semibold text-[#008F75]"
            >
              See weekly schedule
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Store Services */}
        <div className="flex items-start gap-3 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4F7F3]">
            <StoreIcon size={19} className="text-[#00A985]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Store Services</p>

            {store.services?.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {store.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-[#B9E5DF] bg-[#E4F7F3] px-3 py-2 text-xs font-semibold text-[#008F75]"
                  >
                    {service}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No services enabled</p>
            )}
          </div>
        </div>
      </section>

      {/* Store QR Code */}
      <section className="rounded-2xl border border-[#E7EDF1] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <QrCode size={21} className="text-[#00A985]" />
          <h2 className="text-lg font-bold text-[#123D4A]">Store QR Code</h2>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          Customers can scan this QR code to view your store and book services.
          Your QR code remains the same even if your store details change.
        </p>

        <div className="flex flex-col items-center rounded-2xl border border-[#E7EDF1] bg-[#F8FBFC] p-5">
          {getQrImageUrl() ? (
            <img
              src={getQrImageUrl()!}
              alt="Store QR Code"
              className="h-52 w-52 rounded-lg bg-white object-contain p-2"
            />
          ) : (
            <p className="py-10 text-sm text-gray-500">
              QR code is not available.
            </p>
          )}

          <p className="mt-3 text-xs font-medium text-gray-500">
            Your permanent Store Code
          </p>

          <p className="mt-1 break-all text-center text-sm font-bold tracking-wider text-[#142D46]">
            {store.storeCode}
          </p>

          <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleDownloadQrPng}
              disabled={!store.qrImage}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#00A985] px-4 text-sm font-semibold text-white transition hover:bg-[#008F75] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={18} />
              Download PNG
            </button>

            <button
              type="button"
              onClick={handleDownloadQrPdf}
              disabled={!store.qrImage}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#00A985] bg-white px-4 text-sm font-semibold text-[#008F75] transition hover:bg-[#E4F7F3] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={18} />
              Download PDF Poster
            </button>
          </div>
        </div>
      </section>

      {/* Weekly Schedule Modal */}
      {scheduleVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setScheduleVisible(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#142D46]">
                Weekly Schedule
              </h2>

              <button
                onClick={() => setScheduleVisible(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div>
              {DAYS.map((day) => {
                const timing = store.weeklyTimings?.[day.toLowerCase()];

                return (
                  <div
                    key={day}
                    className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                  >
                    <span className="text-sm font-semibold text-[#142D46]">
                      {day}
                    </span>

                    <span
                      className={`text-sm font-medium ${
                        timing?.isClosed ? "text-red-500" : "text-[#00BFA5]"
                      }`}
                    >
                      {!timing
                        ? "Not specified"
                        : timing.isClosed
                          ? "Closed"
                          : `${timing.openTime} - ${timing.closeTime}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Store Gallery */}
      {store.images?.length > 0 && (
        <section className="rounded-2xl border border-[#E7EDF1] bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#123D4A]">
            Store Gallery
          </h2>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {store.images.map((image, index) => (
              <div
                key={`${image.path}-${index}`}
                className="h-28 w-36 flex-shrink-0 overflow-hidden rounded-xl border border-[#E7EDF1] bg-[#F5F8FA]"
              >
                <img
                  src={getImageUrl(image) ?? undefined}
                  alt={`Store image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Edit Store Profile Modal */}
      {editVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditVisible(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#123D4A]">
                  Edit Store Profile
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update your store information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditVisible(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              {/* Main Store Image */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Main Store Image
                </label>

                {selectedMainImage ? (
                  <div className="relative h-28 w-28">
                    <img
                      src={URL.createObjectURL(selectedMainImage)}
                      alt="Selected main store"
                      className="h-full w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedMainImage(null)}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : keepExistingMainImage && store?.image?.path ? (
                  <div className="relative h-28 w-28">
                    <img
                      src={getImageUrl(store.image) ?? ""}
                      alt="Current main store"
                      className="h-full w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setKeepExistingMainImage(false)}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#00A985] bg-[#E4F7F3] text-[#008F75]">
                    <ImageIcon size={25} />
                    <span className="mt-2 text-xs font-medium">
                      Upload Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        setSelectedMainImage(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                )}
              </div>

              {/* Store Gallery */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Store Gallery (Maximum 4)
                </label>

                <div className="flex flex-wrap gap-3">
                  {existingGalleryImages.map((image, index) => (
                    <div
                      key={`${image.path}-${index}`}
                      className="relative h-24 w-24"
                    >
                      <img
                        src={getImageUrl(image) ?? ""}
                        alt={`Gallery image ${index + 1}`}
                        className="h-full w-full rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExistingGalleryImages((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}

                  {selectedGalleryImages.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="relative h-24 w-24"
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`New gallery image ${index + 1}`}
                        className="h-full w-full rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedGalleryImages((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}

                  {existingGalleryImages.length + selectedGalleryImages.length <
                    4 && (
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#00A985] bg-[#E4F7F3] text-[#008F75]">
                      <Plus size={25} />
                      <span className="mt-1 text-xs font-medium">
                        Add Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          const remaining =
                            4 -
                            existingGalleryImages.length -
                            selectedGalleryImages.length;

                          setSelectedGalleryImages((current) => [
                            ...current,
                            ...files.slice(0, remaining),
                          ]);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Store Name
                </label>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Enter store name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#00BFA5] focus:ring-2 focus:ring-[#00BFA5]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Physical Store Address
                </label>
                <input
                  value={editAddress}
                  onChange={(event) => setEditAddress(event.target.value)}
                  placeholder="Enter complete physical store address"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#00BFA5] focus:ring-2 focus:ring-[#00BFA5]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Contact Number
                </label>
                <div className="flex overflow-hidden rounded-xl border border-gray-200 focus-within:border-[#00BFA5]">
                  <span className="flex items-center border-r border-gray-200 bg-gray-50 px-4 text-sm text-gray-600">
                    +91
                  </span>
                  <input
                    value={editContactNumber}
                    onChange={(event) =>
                      setEditContactNumber(
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    className="min-w-0 flex-1 px-4 py-3 text-sm text-gray-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Google Maps Link
                </label>
                <input
                  value={editAddressLink}
                  onChange={(event) => setEditAddressLink(event.target.value)}
                  placeholder="Paste your Google Maps link"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#00BFA5] focus:ring-2 focus:ring-[#00BFA5]/10"
                />
              </div>

              {/* Store Services */}
              <div>
                <h3 className="mb-2 mt-2 text-base font-bold text-[#123D4A]">
                  Store Services
                </h3>

                <p className="mb-3 text-xs text-gray-500">
                  At least one service must remain enabled.
                </p>

                {(["Phone Charging", "Pick Me Later"] as StoreService[]).map(
                  (service) => {
                    const enabled = editServices.includes(service);

                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => {
                          if (enabled && editServices.length === 1) {
                            setError(
                              "At least one service must remain enabled.",
                            );
                            return;
                          }

                          setEditServices((current) =>
                            enabled
                              ? current.filter((item) => item !== service)
                              : [...current, service],
                          );
                          setError("");
                        }}
                        className={`mb-3 flex w-full items-center justify-between rounded-xl border p-4 text-left ${
                          enabled
                            ? "border-[#00A985] bg-[#E4F7F3]"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <span>
                          <span className="block font-semibold text-[#123D4A]">
                            {service}
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            {enabled ? "Enabled" : "Disabled"}
                          </span>
                        </span>

                        <span
                          className={`flex h-6 w-11 items-center rounded-full px-1 ${
                            enabled
                              ? "justify-end bg-[#00A985]"
                              : "justify-start bg-gray-300"
                          }`}
                        >
                          <span className="h-4 w-4 rounded-full bg-white" />
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              {/* Weekly Schedule */}
              <div>
                <h3 className="mb-2 mt-4 text-base font-bold text-[#123D4A]">
                  Weekly Schedule
                </h3>

                <p className="mb-3 text-xs text-gray-500">
                  Set your store opening hours for each day.
                </p>

                {DAYS.map((day) => {
                  const dayKey = day.toLowerCase();
                  const timing = editWeeklyTimings[dayKey] ?? {
                    isClosed: true,
                  };

                  return (
                    <div
                      key={day}
                      className="mb-3 rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#123D4A]">
                          {day}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setEditWeeklyTimings((current) => ({
                              ...current,
                              [dayKey]: {
                                ...(current[dayKey] ?? { isClosed: true }),
                                isClosed: !timing.isClosed,
                              },
                            }))
                          }
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                            timing.isClosed
                              ? "bg-gray-100 text-gray-600"
                              : "bg-[#E4F7F3] text-[#008F78]"
                          }`}
                        >
                          {timing.isClosed ? "Closed" : "Open"}
                        </button>
                      </div>

                      {!timing.isClosed && (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">
                              Opening Time
                            </label>
                            <div className="flex gap-1.5">
                              <select
                                value={String(
                                  Number(
                                    timing.openTime?.match(
                                      /^(\d{1,2}):/,
                                    )?.[1] ?? "9",
                                  ),
                                )}
                                onChange={(event) =>
                                  setEditWeeklyTimings((current) => ({
                                    ...current,
                                    [dayKey]: {
                                      ...current[dayKey],
                                      openTime: `${String(event.target.value).padStart(2, "0")}:${timing.openTime?.match(/:(\d{2})/)?.[1] ?? "00"} ${timing.openTime?.match(/(AM|PM)$/i)?.[1] ?? "AM"}`,
                                    },
                                  }))
                                }
                                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm"
                              >
                                {Array.from(
                                  { length: 12 },
                                  (_, i) => i + 1,
                                ).map((hour) => (
                                  <option key={hour} value={String(hour)}>
                                    {hour}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={
                                  timing.openTime?.match(/:(\d{2})/)?.[1] ??
                                  "00"
                                }
                                onChange={(event) =>
                                  setEditWeeklyTimings((current) => ({
                                    ...current,
                                    [dayKey]: {
                                      ...current[dayKey],
                                      openTime: `${timing.openTime?.match(/^(\d{1,2}):/)?.[1] ?? "9"}:${event.target.value} ${timing.openTime?.match(/(AM|PM)$/i)?.[1] ?? "AM"}`,
                                    },
                                  }))
                                }
                                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm"
                              >
                                {Array.from({ length: 60 }, (_, i) =>
                                  String(i).padStart(2, "0"),
                                ).map((minute) => (
                                  <option key={minute} value={minute}>
                                    {minute}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={
                                  timing.openTime
                                    ?.match(/(AM|PM)$/i)?.[1]
                                    ?.toUpperCase() ?? "AM"
                                }
                                onChange={(event) =>
                                  setEditWeeklyTimings((current) => ({
                                    ...current,
                                    [dayKey]: {
                                      ...current[dayKey],
                                      openTime: `${timing.openTime?.match(/^(\d{1,2}):/)?.[1] ?? "9"}:${timing.openTime?.match(/:(\d{2})/)?.[1] ?? "00"} ${event.target.value}`,
                                    },
                                  }))
                                }
                                className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs text-gray-500">
                              Closing Time
                            </label>
                            <div className="flex gap-1.5">
                              <select
                                value={String(
                                  Number(
                                    timing.closeTime?.match(
                                      /^(\d{1,2}):/,
                                    )?.[1] ?? "9",
                                  ),
                                )}
                                onChange={(event) =>
                                  setEditWeeklyTimings((current) => ({
                                    ...current,
                                    [dayKey]: {
                                      ...current[dayKey],
                                      closeTime: `${String(event.target.value).padStart(2, "0")}:${timing.closeTime?.match(/:(\d{2})/)?.[1] ?? "00"} ${timing.closeTime?.match(/(AM|PM)$/i)?.[1] ?? "PM"}`,
                                    },
                                  }))
                                }
                                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm"
                              >
                                {Array.from(
                                  { length: 12 },
                                  (_, i) => i + 1,
                                ).map((hour) => (
                                  <option key={hour} value={String(hour)}>
                                    {hour}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={
                                  timing.closeTime?.match(/:(\d{2})/)?.[1] ??
                                  "00"
                                }
                                onChange={(event) =>
                                  setEditWeeklyTimings((current) => ({
                                    ...current,
                                    [dayKey]: {
                                      ...current[dayKey],
                                      closeTime: `${timing.closeTime?.match(/^(\d{1,2}):/)?.[1] ?? "6"}:${event.target.value} ${timing.closeTime?.match(/(AM|PM)$/i)?.[1] ?? "PM"}`,
                                    },
                                  }))
                                }
                                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm"
                              >
                                {Array.from({ length: 60 }, (_, i) =>
                                  String(i).padStart(2, "0"),
                                ).map((minute) => (
                                  <option key={minute} value={minute}>
                                    {minute}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={
                                  timing.closeTime
                                    ?.match(/(AM|PM)$/i)?.[1]
                                    ?.toUpperCase() ?? "PM"
                                }
                                onChange={(event) =>
                                  setEditWeeklyTimings((current) => ({
                                    ...current,
                                    [dayKey]: {
                                      ...current[dayKey],
                                      closeTime: `${timing.closeTime?.match(/^(\d{1,2}):/)?.[1] ?? "6"}:${timing.closeTime?.match(/:(\d{2})/)?.[1] ?? "00"} ${event.target.value}`,
                                    },
                                  }))
                                }
                                className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modal Actions */}
              <div className="mt-5 flex gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditVisible(false);
                    setError("");
                  }}
                  disabled={savingProfile}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#008F75] py-3 font-semibold text-white disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
