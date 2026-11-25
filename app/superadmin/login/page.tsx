
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/superadmin/AuthLayout";
import {
  loginUser,
  getRegistrationStatus,
} from "@/services/superadmin/authService";
import { useAuthStore } from "@/stores/superadmin/authStore";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(false);

  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const result = await getRegistrationStatus();
        setRegistrationOpen(result.data.registrationOpen);
      } catch (error) {
        console.error("Failed to check registration status:", error);
        setRegistrationOpen(false);
      }
    };

    checkRegistration();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await loginUser({ phone, password });

      if (!result.data) {
        throw new Error("Invalid login response from server");
      }

      setSession(result.data.token, {
        id: result.data.user.id,
        name: result.data.user.name,
        phone: result.data.user.phone,
      });

      window.location.href = "/superadmin/dashboard";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#142D46] sm:text-4xl">
          Welcome back
        </h1>

        <p className="mt-2 text-base leading-relaxed text-[#697589]">
          Sign in to manage stores, approvals, and platform settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phone number */}
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-semibold text-[#142D46]"
          >
            Phone number
          </label>

          <div className="flex w-full overflow-hidden rounded-xl border border-[#D5DDE5] transition focus-within:border-[#00BFA5] focus-within:ring-2 focus-within:ring-[#00BFA5]/15">
            <span className="flex items-center border-r border-[#D5DDE5] bg-[#F7F9FB] px-5 text-base font-medium text-[#142D46]">
              +91
            </span>

            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="Enter 10-digit number"
              required
              minLength={10}
              maxLength={10}
              pattern="[0-9]{10}"
              inputMode="numeric"
              autoComplete="tel-national"
              className="w-full bg-white px-4 py-4 text-base text-[#142D46] outline-none placeholder:text-[#929AAA]"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-[#142D46]"
          >
            Password
          </label>

          <div className="flex w-full items-center overflow-hidden rounded-xl border border-[#D5DDE5] transition focus-within:border-[#00BFA5] focus-within:ring-2 focus-within:ring-[#00BFA5]/15">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full bg-white px-4 py-4 text-base text-[#142D46] outline-none placeholder:text-[#929AAA]"
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="px-4 text-[#7B8798] transition hover:text-[#00A58D]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        {/* Sign in */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-[#079D91] to-[#00A88D] px-5 py-4 text-lg font-bold text-white shadow-md shadow-[#00BFA5]/15 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {registrationOpen && (
        <p className="mt-6 text-center text-sm text-[#697589]">
          Don't have an account?{" "}
          <Link
            href="/superadmin/signup"
            className="font-bold text-[#009D87] hover:underline"
          >
            Create account
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
