import { create } from "zustand";

interface ShopOwnerAuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useShopOwnerAuthStore = create<ShopOwnerAuthState>((set) => ({
  token:
    typeof window !== "undefined"
      ? localStorage.getItem("shopOwnerToken")
      : null,

  setToken: (token) => {
    localStorage.setItem("shopOwnerToken", token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem("shopOwnerToken");
    set({ token: null });
  },
}));