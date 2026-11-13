
import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setSession: (token: string, user: AuthUser) => void;
  hydrateSession: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  // Save the login session.
  setSession: (token, user) => {
    sessionStorage.setItem("nexopodToken", token);
    sessionStorage.setItem("nexopodUser", JSON.stringify(user));

    set({
      token,
      user,
      isAuthenticated: true,
      isHydrated: true,
    });
  },

  // Restore the existing session when the app loads.
  hydrateSession: () => {
    const token = sessionStorage.getItem("nexopodToken");
    const savedUser = sessionStorage.getItem("nexopodUser");

    if (!token || !savedUser) {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });
      return;
    }

    try {
      const user = JSON.parse(savedUser) as AuthUser;

      set({
        token,
        user,
        isAuthenticated: true,
        isHydrated: true,
      });
    } catch {
      sessionStorage.removeItem("nexopodToken");
      sessionStorage.removeItem("nexopodUser");

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },

  // Clear the session during logout.
  clearSession: () => {
    sessionStorage.removeItem("nexopodToken");
    sessionStorage.removeItem("nexopodUser");

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
}));
