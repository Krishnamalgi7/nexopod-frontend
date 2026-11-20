
import API_BASE_URL from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

export interface StoreProfileReviewRequest {
  _id: string;
  storeId: {
    _id: string;
    name: string;
    contactNumber: string;
    addressLink: string;
    image?: {
      type: string;
      path: string;
    };
    images?: {
      type: string;
      path: string;
    }[];
    isActive: boolean;
  } | null;
  status: "pending" | "approved" | "rejected";
  proposedProfile: {
    name?: string;
    contactNumber?: string;
    addressLink?: string;
    timings?: string;
    services?: string[];
    weeklyTimings?: Record<string, unknown>;
    image?: {
      type: string;
      path: string;
    };
    images?: {
      type: string;
      path: string;
    }[];
  };
  createdAt: string;
}

const getAuthHeaders = () => {
  const token = sessionStorage.getItem("nexopodToken");

  if (!token) {
    useAuthStore.getState().clearSession();
    throw new Error("Your session has expired. Please log in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getStoreProfileReview = async (
  requestId: string
): Promise<StoreProfileReviewRequest> => {
  const response = await fetch(
    `${API_BASE_URL}/api/stores/profile-change-requests/${requestId}`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clearSession();
    }

    throw new Error(result.message || "Failed to load review request.");
  }

  return result.data.request;
};

export const approveStoreProfileReview = async (
  requestId: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/api/stores/profile-change-requests/${requestId}/approve`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clearSession();
    }

    throw new Error(result.message || "Failed to approve request.");
  }

  return result;
};

export const rejectStoreProfileReview = async (
  requestId: string,
  reason: string
) => {
  const response = await fetch(
    `${API_BASE_URL}/api/stores/profile-change-requests/${requestId}/reject`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clearSession();
    }

    throw new Error(result.message || "Failed to reject request.");
  }

  return result;
};

export const getPendingStoreProfileImage = async (
  requestId: string,
  imageType: "main" | "gallery",
  imageIndex?: number
): Promise<Blob> => {
  const imagePath =
    imageType === "main"
      ? `/api/stores/profile-change-requests/${requestId}/images/main`
      : `/api/stores/profile-change-requests/${requestId}/images/gallery/${imageIndex}`;

  const response = await fetch(`${API_BASE_URL}${imagePath}`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Failed to load pending store image.";

    try {
      const result = await response.json();
      message = result.message || message;
    } catch {
      // Keep the default error message.
    }

    if (response.status === 401) {
      useAuthStore.getState().clearSession();
    }

    throw new Error(message);
  }

  return response.blob();
};


export interface StoreProfileReviewListResponse {
  requests: StoreProfileReviewRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export const getStoreProfileReviewRequests = async ({
  status = "all",
  search = "",
  page = 1,
  limit = 10,
}: {
  status?: "all" | "pending" | "approved" | "rejected";
  search?: string;
  page?: number;
  limit?: number;
}): Promise<StoreProfileReviewListResponse> => {
  const query = new URLSearchParams({
    status,
    search,
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `${API_BASE_URL}/api/stores/profile-change-requests?${query.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clearSession();
    }

    throw new Error(
      result.message || "Failed to fetch store-profile requests."
    );
  }

  return result.data;
};
