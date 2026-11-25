
"use client";
import { useShopOwnerAuthStore } from "@/stores/shopowner/authStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LockKeyhole,
  Smartphone,
  ShieldCheck,
  LoaderCircle,
  ArrowRight,
} from "lucide-react";

import {
  sendShopOwnerOtp,
  verifyShopOwnerOtp,
} from "@/services/shopowner/authService";

export default function ShopOwnerLoginPage() {
  const router = useRouter();
const setToken = useShopOwnerAuthStore((state) => state.setToken);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!otpRequested || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpRequested, secondsRemaining]);

  const formattedTime = `${Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, "0")}:${(secondsRemaining % 60)
    .toString()
    .padStart(2, "0")}`;

  const handleSendOtp = async () => {
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await sendShopOwnerOtp(mobileNumber);

      setOtpRequested(true);
      setOtp("");
      setSecondsRemaining(result.expiresIn || 120);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to send OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otpRequested || secondsRemaining <= 0) {
      setError("OTP expired. Please request a new OTP.");
      return;
    }

    if (!/^[0-9]{4}$/.test(otp)) {
      setError("Enter a valid 4-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyShopOwnerOtp(mobileNumber, otp);

      setToken(result.token);

      router.replace(
        result.store.isActive
          ? "/shopowner/dashboard"
          : "/shopowner/profile",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otpRequested) {
      handleLogin();
    } else {
      handleSendOtp();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F0FFFA] px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-[38px] font-extrabold tracking-tight text-[#142D46]">
            Nexo<span className="text-[#00BFA5]">Pod</span>
          </h1>

          <h2 className="mt-5 text-2xl font-bold text-[#142D46]">
            Shop Owner Login
          </h2>

          <p className="mt-2 text-sm text-[#7B8798]">
            Welcome back! Sign in to manage your store.
          </p>
        </div>

        <div className="rounded-[28px] border border-[#DCEFE8] bg-white p-6 shadow-[0_12px_40px_rgba(20,45,70,0.08)] sm:p-8">
          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-sm font-semibold text-[#244B5A]">
              Mobile Number
            </label>

            <div className="mb-6 flex h-[58px] items-center rounded-2xl border border-[#DCE9E5] bg-[#FBFFFD] px-4 transition focus-within:border-[#00BFA5] focus-within:ring-2 focus-within:ring-[#00BFA5]/10">
              <Smartphone size={21} className="shrink-0 text-[#00BFA5]" />

              <span className="ml-3 font-bold text-[#142D46]">+91</span>

              <div className="mx-3 h-8 w-px bg-[#DCE9E5]" />

              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={mobileNumber}
                onChange={(event) => {
                  setMobileNumber(
                    event.target.value.replace(/[^0-9]/g, "").slice(0, 10),
                  );
                  setOtpRequested(false);
                  setOtp("");
                  setSecondsRemaining(0);
                  setError("");
                }}
                placeholder="Enter mobile number"
                maxLength={10}
                className="w-full bg-transparent text-base text-[#142D46] outline-none placeholder:text-[#9AA9B8]"
              />
            </div>

            {otpRequested && (
              <>
                <label className="mb-2 block text-sm font-semibold text-[#244B5A]">
                  One-Time Password
                </label>

                <div className="mb-3 flex h-[58px] items-center rounded-2xl border border-[#DCE9E5] bg-[#FBFFFD] px-4 transition focus-within:border-[#00BFA5] focus-within:ring-2 focus-within:ring-[#00BFA5]/10">
                  <LockKeyhole size={21} className="shrink-0 text-[#00BFA5]" />

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) =>
                      setOtp(
                        event.target.value.replace(/[^0-9]/g, "").slice(0, 4),
                      )
                    }
                    placeholder="Enter 4-digit OTP"
                    maxLength={4}
                    className="ml-3 w-full bg-transparent text-base tracking-[5px] text-[#142D46] outline-none placeholder:tracking-normal placeholder:text-[#9AA9B8]"
                  />
                </div>

                <div className="mb-6 flex items-center justify-between gap-2">
                  {secondsRemaining > 0 ? (
                    <p className="text-sm text-[#64748B]">
                      OTP expires in{" "}
                      <span className="font-bold text-[#00BFA5]">
                        {formattedTime}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-red-500">
                      OTP expired
                    </p>
                  )}

                  {secondsRemaining <= 0 && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-sm font-bold text-[#00A985] hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || (otpRequested && secondsRemaining <= 0)}
              className="flex h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-[#00BFA5] text-lg font-bold tracking-wide text-white shadow-md transition hover:bg-[#00A98F] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={20} className="animate-spin" />
                  {otpRequested ? "Verifying..." : "Sending OTP..."}
                </>
              ) : (
                <>
                  {otpRequested ? "Verify & Login" : "Send OTP"}
                  <ArrowRight size={19} />
                </>
              )}
            </button>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                {error}
              </p>
            )}
          </form>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2">
          <ShieldCheck size={19} className="text-[#00A985]" />
          <p className="text-sm font-medium text-[#718096]">
            Secure Shop Owner Access
          </p>
        </div>
      </div>
    </main>
  );
}
