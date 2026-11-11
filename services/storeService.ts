
import API_BASE_URL from "./api";

export interface CreateStoreData {
    name: string;
    addressLink: string;
    contactNumber: string;
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
        image: {
            type: "upload";
            path: string;
        };
        images: {
            type: "upload";
            path: string;
        }[];
        createdAt: string;
    };
}

export const createStore = async (
    storeData: CreateStoreData
): Promise<CreateStoreResponse> => {
    const token = sessionStorage.getItem("nexopodToken");

    if (!token) {
        throw new Error("Your session has expired. Please log in again.");
    }

    const formData = new FormData();

    formData.append("name", storeData.name.trim());
    formData.append("addressLink", storeData.addressLink.trim());
    formData.append("contactNumber", storeData.contactNumber);

    // Backend expects the main image under "image".
    formData.append("image", storeData.image);

    // Backend accepts up to four additional images under "images".
    storeData.images.forEach((file) => {
        formData.append("images", file);
    });

    const response = await fetch(`${API_BASE_URL}/api/stores`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    const result: CreateStoreResponse = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
        }

        throw new Error(result.message || "Failed to create store.");
    }

    return result;
};


export interface StoreItem {
    _id: string;
    name: string;
    addressLink: string;
    contactNumber: string;
    image: {
        type: "upload";
        path: string;
    };
    images: {
        type: "upload";
        path: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

interface GetStoresResponse {
    success: boolean;
    count: number;
    data: StoreItem[];
}

export const getStores = async (): Promise<GetStoresResponse> => {
    const token = sessionStorage.getItem("nexopodToken");

    if (!token) {
        throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}/api/stores`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    const result: GetStoresResponse = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
        }

        throw new Error("Unable to fetch stores.");
    }

    return result;
};

