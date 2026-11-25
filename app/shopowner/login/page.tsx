
"use client";
import Image from "next/image";
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
  <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#DDFBF5] via-[#F8FFFD] to-[#D5F8F1]">
    {/* Decorative background */}
    <div className="pointer-events-none absolute -left-32 -top-40 h-[420px] w-[650px] -rotate-12 rounded-[50%] border-[35px] border-[#8DEDE0]/40" />
    <div className="pointer-events-none absolute -bottom-64 -right-32 h-[450px] w-[700px] rotate-[-15deg] rounded-[50%] border-[45px] border-[#8DEDE0]/30" />

    <div className="relative z-10 mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 items-center gap-8 px-5 py-10 lg:grid-cols-2 lg:gap-12 lg:px-12">
      {/* Left illustration */}
      <section className="flex items-center justify-center">
        <div className="w-full max-w-[560px]">
          <Image
            src="/nexopod-store-hero.png"
            alt="NexoPod shop illustration"
            width={1200}
            height={1200}
            priority
            className="mx-auto h-auto max-h-[300px] w-full object-contain sm:max-h-[420px] lg:max-h-[620px]"
          />
        </div>
      </section>

      {/* Right login section */}
      <section className="mx-auto w-full max-w-[650px]">
        <div className="mb-9 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#142D46] sm:text-5xl">
            Nexo<span className="text-[#00BFA5]">Pod</span>
          </h1>

          <h2 className="mt-7 text-2xl font-extrabold text-[#142D46] sm:text-3xl">
            Shop Owner Login
          </h2>

          <p className="mt-3 text-base text-[#64748B] sm:text-lg">
            Welcome back! Sign in to manage your store.
          </p>
        </div>

        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(20,75,80,0.10)] backdrop-blur-sm sm:p-10">
          <form onSubmit={handleSubmit}>
            <label className="mb-3 block text-lg font-semibold text-[#142D46]">
              Mobile Number
            </label>

            <div className="mb-7 flex h-[72px] items-center rounded-2xl border border-[#DCE5EC] bg-white px-5 transition focus-within:border-[#00BFA5] focus-within:ring-2 focus-within:ring-[#00BFA5]/10">
              <Smartphone size={24} className="shrink-0 text-[#00BFA5]" />

              <span className="ml-5 font-bold text-[#142D46]">+91</span>

              <div className="mx-5 h-9 w-px bg-[#DCE5EC]" />

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
                <label className="mb-3 block text-lg font-semibold text-[#142D46]">
                  One-Time Password
                </label>

                <div className="mb-3 flex h-[72px] items-center rounded-2xl border border-[#DCE5EC] bg-white px-5 transition focus-within:border-[#00BFA5] focus-within:ring-2 focus-within:ring-[#00BFA5]/10">
                  <LockKeyhole size={23} className="shrink-0 text-[#00BFA5]" />

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
                    className="ml-4 w-full bg-transparent text-base tracking-[5px] text-[#142D46] outline-none placeholder:tracking-normal placeholder:text-[#9AA9B8]"
                  />
                </div>

                <div className="mb-7 flex items-center justify-between gap-2">
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
              className="flex h-[76px] w-full items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-[#00BFA5] to-[#00AA91] text-lg font-bold text-white shadow-lg shadow-[#00BFA5]/20 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={22} className="animate-spin" />
                  {otpRequested ? "Verifying..." : "Sending OTP..."}
                </>
              ) : (
                <>
                  {otpRequested ? "Verify & Login" : "Send OTP"}
                  <ArrowRight size={22} />
                </>
              )}
            </button>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {error}
              </p>
            )}
          </form>
        </div>

        <div className="mt-9 flex items-center justify-center gap-3">
          <ShieldCheck size={24} className="text-[#00BFA5]" />
          <p className="text-base font-medium text-[#52647D]">
            Secure Shop Owner Access
          </p>
        </div>
      </section>
    </div>
  </main>
);}
