"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import API_BASE_URL from "@/services/common/api";

export default function PickerVerificationPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [pickerName, setPickerName] = useState("");

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pin.length !== 6 || loading || verified) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/pick-me-later/verify/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pin }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to verify pickup.");
      }

      setPickerName(result.data?.pickerName || "Picker");
      setVerified(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify pickup. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F8FA] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[#E7EDF1] bg-white p-6 shadow-lg sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E4F7F3] text-[#00BFA5]">
          {verified ? <CheckCircle2 size={34} /> : <ShieldCheck size={34} />}
        </div>

        <div className="mt-5 text-center">
          <h1 className="text-2xl font-extrabold text-[#142D46]">
            {verified ? "Pickup Verified" : "Verify Your Pickup"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#7B8798]">
            {verified
              ? "Your identity has been verified successfully. Please proceed to the store for collection."
              : "Enter the six-digit pickup PIN shared with you to verify your identity."}
          </p>
        </div>

        {verified ? (
          <div className="mt-7 rounded-2xl border border-[#B8EDE3] bg-[#E4F7F3] p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#52766F]">
              Verified Picker
            </p>
            <p className="mt-2 text-lg font-bold text-[#164653]">
              {pickerName}
            </p>
            <p className="mt-3 text-sm font-medium text-[#16836F]">
              You can now collect the item from the store.
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="pickup-pin"
                className="mb-2 block text-sm font-semibold text-[#142D46]"
              >
                Six-Digit Pickup PIN
              </label>

              <input
                id="pickup-pin"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={pin}
                onChange={(event) =>
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit PIN"
                required
                className="w-full rounded-xl border border-[#E7EDF1] bg-[#F9FBFC] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-[#142D46] outline-none transition focus:border-[#00BFA5] focus:ring-2 focus:ring-[#00BFA5]/15"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pin.length !== 6 || loading}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFA5] to-[#00C99A] px-5 py-3 font-bold text-white shadow-md shadow-[#00BFA5]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle size={20} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Pickup"
              )}
            </button>
          </form>
        )}

        <p className="mt-7 text-center text-xs text-[#9AA6B2]">
          NexoPod · Secure Pickup Verification
        </p>
      </section>
    </main>
  );
}
