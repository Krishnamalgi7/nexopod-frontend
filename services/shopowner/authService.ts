
import API_BASE_URL from "@/services/common/api";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface ShopOwnerAuthData {
  role: string;
  token: string;
  store: {
    isActive: boolean;
    [key: string]: unknown;
  };
}

const readResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
};

export const sendShopOwnerOtp = async (phone: string) => {
  const response = await fetch(
    `${API_BASE_URL}/api/role-auth/send-otp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    },
  );

  const result = await readResponse<{ expiresIn?: number }>(response);

  return result.data;
};

export const verifyShopOwnerOtp = async (
  phone: string,
  otp: string,
): Promise<ShopOwnerAuthData> => {
  const response = await fetch(
    `${API_BASE_URL}/api/role-auth/verify-otp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp }),
    },
  );

  const result = await readResponse<
    ShopOwnerAuthData & { requiresRoleSelection?: boolean; selectionToken?: string }
  >(response);

  let authData = result.data;

  if (authData.requiresRoleSelection) {
    const roleResponse = await fetch(
      `${API_BASE_URL}/api/role-auth/select-role`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectionToken: authData.selectionToken,
          role: "shopOwner",
        }),
      },
    );

    const roleResult =
      await readResponse<ShopOwnerAuthData>(roleResponse);

    authData = roleResult.data;
  }

  if (authData.role !== "shopOwner" || !authData.token) {
    throw new Error("This number is not registered as a Shop Owner.");
  }

  return authData;
};
