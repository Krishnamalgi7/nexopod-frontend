import API_BASE_URL from "./api";

interface RegisterData {
    name: string;
    phone: string;
    password: string;
}

interface RegisterResponse {
    success: boolean;
    message: string;
    data?: {
        id: string;
        name: string;
        phone: string;
        createdAt: string;
    };
}

interface LoginData {
    phone: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        user: {
            id: string;
            name: string;
            phone: string;
        };
    };
}

export const registerUser = async (
    userData: RegisterData
): Promise<RegisterResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    const result: RegisterResponse = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Registration failed");
    }

    return result;
};

export const loginUser = async (
    loginData: LoginData
): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
    });

    const result: LoginResponse = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Login failed");
    }

    return result;
};