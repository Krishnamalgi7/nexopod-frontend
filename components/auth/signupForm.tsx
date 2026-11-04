"use client";

import { useState } from "react";
import Link from "next/link";
import { registerUser } from "@/services/authService";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await registerUser({
        name,
        phone,
        password,
      });

      setSuccess(result.message);

      setName("");
      setPhone("");
      setPassword("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-blue-600">
          NEXOPOD
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Get started with NexoPod today.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Full name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your full name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex w-full overflow-hidden rounded-xl border border-gray-300 transition focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
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
            placeholder="Create a password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            Password must contain at least 8 characters.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
