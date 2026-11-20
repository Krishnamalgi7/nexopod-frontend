
import API_BASE_URL from "./api";
import { useAuthStore } from "@/stores/authStore";

export interface StoreProfileNotification {
    _id: string;
    requestId: string;
    storeId: {
        _id: string;
        name: string;
        contactNumber?: string;
    } | null;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationResponse {
    success: boolean;
    message: string;
    data: {
        notifications: StoreProfileNotification[];
        unreadCount: number;
        total: number;
    };
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

export const getStoreProfileNotifications =
    async (): Promise<NotificationResponse> => {
        const response = await fetch(
            `${API_BASE_URL}/api/stores/profile-notifications`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        const result: NotificationResponse = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                useAuthStore.getState().clearSession();
            }

            throw new Error(
                result.message || "Failed to fetch notifications."
            );
        }

        return result;
    };

export const markStoreProfileNotificationRead =
    async (notificationId: string) => {
        const response = await fetch(
            `${API_BASE_URL}/api/stores/profile-notifications/${notificationId}/read`,
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

            throw new Error(
                result.message || "Failed to mark notification as read."
            );
        }

        return result;
    };
