import API_BASE_URL from "./api";
import { useAuthStore } from "@/stores/authStore";

const handleUnauthorized = () => {
    useAuthStore.getState().clearSession();

    if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
    ) {
        window.location.replace("/login");
    }
};

export interface CreateStoreData {
    name: string;
    addressLink: string;
    contactNumber: string;
    timings: string;
    services: string[];
    weeklyTimings: Record<string, {
        isClosed: boolean;
        openTime: string;
        closeTime: string;
    }>;
    image: File;
    images: File[];
}

interface CreateStoreResponse {
    success: boolean;
    message: string;
    data?: {
        _id: string;
        name: string;
        addressLink: string;
        contactNumber: string;
        timings: string;
        isActive: boolean;
        image: { type: "upload"; path: string; };
        images: { type: "upload"; path: string; }[];
        createdAt: string;
    };
}

export const createStore = async (storeData: CreateStoreData): Promise<CreateStoreResponse> => {
    const token = sessionStorage.getItem("nexopodToken");
    if (!token) {
        handleUnauthorized();
        throw new Error("Your session has expired. Please log in again.");
    }

    const formData = new FormData();
    formData.append("name", storeData.name.trim());
    formData.append("addressLink", storeData.addressLink.trim());
    formData.append("contactNumber", storeData.contactNumber);
    formData.append("timings", storeData.timings.trim());
formData.append("services", JSON.stringify(storeData.services));
formData.append("weeklyTimings", JSON.stringify(storeData.weeklyTimings));
formData.append("image", storeData.image);

    storeData.images.forEach((file) => {
        formData.append("images", file);
    });

    const response = await fetch(`${API_BASE_URL}/api/stores/create-store`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    const result: CreateStoreResponse = await response.json();

    if (!response.ok) {
         handleUnauthorized();
        if (response.status === 401) throw new Error("Your session has expired. Please log in again.");
        throw new Error(result.message || "Failed to create store.");
    }
    return result;
};


export interface StoreDayTiming {
    isClosed: boolean;
    openTime?: string;
    closeTime?: string;
}


export interface StoreItem {
    _id: string;
    name: string;
    addressLink: string;
    contactNumber: string;
    timings: string;
    services?: string[];
weeklyTimings?: Record<string, StoreDayTiming>;
    isActive: boolean;
    image: { type: "upload"; path: string; };
    images: { type: "upload"; path: string; }[];
    createdAt: string;
    updatedAt: string;
}

export interface PaginationData {
    totalStores: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface GetStoresResponse {
    success: boolean;
    count: number;
    pagination: PaginationData;
    data: StoreItem[];
}

export interface GetStoresParams {
    search?: string;
    status?: "all" | "active" | "inactive";
    service?: "all" | "Phone Charging" | "Pick Me Later" | "both";
    page?: number;
    limit?: number;
}

export const getStores = async (params: GetStoresParams = {}): Promise<GetStoresResponse> => {
    const token = sessionStorage.getItem("nexopodToken");

    if (!token) {
        handleUnauthorized();
        throw new Error("Your session has expired. Please log in again.");
    }

    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.service) queryParams.append("service", params.service);
    if (params.page) queryParams.append("page", String(params.page));
    if (params.limit) queryParams.append("limit", String(params.limit));

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/stores/get-all-stores${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    const result: GetStoresResponse = await response.json();

    if (!response.ok) {
        handleUnauthorized();
        if (response.status === 401) throw new Error("Your session has expired. Please log in again.");
        throw new Error("Unable to fetch stores.");
    }
    return result;
};

export interface StoreStats {
    totalStores: number;
    activeStores: number;
    inactiveStores: number;
}

export const getStoreStats = async (): Promise<StoreStats> => {
    const token = sessionStorage.getItem("nexopodToken");

    if (!token) {
        handleUnauthorized();
        throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}/api/stores/get-store-stats`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
        handleUnauthorized();
        if (response.status === 401) throw new Error("Your session has expired. Please log in again.");
        throw new Error("Unable to fetch store statistics.");
    }
    return result.data;
};

export const updateStoreStatus = async (
    storeId: string,
    isActive: boolean
): Promise<{ success: boolean; message: string; data: StoreItem }> => {
    const token = sessionStorage.getItem("nexopodToken");

    if (!token) {
        handleUnauthorized();
        throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}/api/stores/update-store-status/${storeId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
    });

    const result = await response.json();

    if (!response.ok) {
        handleUnauthorized();
        if (response.status === 401) throw new Error("Your session has expired. Please log in again.");
        throw new Error(result.message || "Failed to update store status.");
    }
    return result;
};


export interface UpdateStoreDetailsData {
    name: string;
    addressLink: string;
    contactNumber: string;
    timings: string;
    services: string[];
    weeklyTimings: Record<string, unknown>;
    existingImages: string[];
    image?: File | null;
    images: File[];
}

export const updateStoreDetails = async (
    storeId: string,
    details: UpdateStoreDetailsData
): Promise<{ success: boolean; message: string; data: StoreItem }> => {
    const token = sessionStorage.getItem("nexopodToken");

    if (!token) {
        handleUnauthorized();
        throw new Error("Your session has expired. Please log in again.");
    }

    const formData = new FormData();

    // Basic store details
    formData.append("name", details.name.trim());
    formData.append("addressLink", details.addressLink.trim());
    formData.append("contactNumber", details.contactNumber);
    formData.append("timings", details.timings.trim());

    // Store services and weekly schedule
    formData.append("services", JSON.stringify(details.services));
    formData.append("weeklyTimings", JSON.stringify(details.weeklyTimings));

    // Existing additional images selected to be retained
    formData.append("existingImages", JSON.stringify(details.existingImages));

    // New main image (optional)
    if (details.image) {
        formData.append("image", details.image);
    }

    // New additional images
    details.images.forEach((file) => {
        formData.append("images", file);
    });

    const response = await fetch(
        `${API_BASE_URL}/api/stores/update-store/${storeId}`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        }
    );

    const result = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            handleUnauthorized();
            throw new Error("Your session has expired. Please log in again.");
        }

        throw new Error(result.message || "Failed to update store details.");
    }

    return result;
};
