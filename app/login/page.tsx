"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { loginUser, getRegistrationStatus } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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

      window.location.href = "/dashboard";
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
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-blue-600">
            NEXOPOD
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to continue to NexoPod.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Phone number
            </label>

            <div className="flex w-full overflow-hidden rounded-xl border border-gray-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
              <span className="flex items-center border-r border-gray-300 bg-gray-50 px-4 text-sm font-medium text-gray-700">
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
                className="w-full bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {registrationOpen && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Create account
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
