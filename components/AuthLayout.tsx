"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRegistrationStatus } from "@/services/authService";

interface AuthLayoutProps {
  children: React.ReactNode;
  mode: "login" | "signup";
}

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
  const [registrationOpen, setRegistrationOpen] = useState(false);

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

  return (
    <main
      className="flex min-h-screen items-center justify-end overflow-hidden bg-[#f7ffff] bg-no-repeat px-4 py-6 sm:px-8 lg:px-12"
      style={{
        backgroundImage: "url('/nexopod-auth-brand.png')",
        backgroundSize: "100% auto",
        backgroundPosition: "50% center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#f7ffff",
      }}
    >
      {/* Authentication panel overlays the empty right side */}
      <section className="w-full max-w-[490px] rounded-[26px] border border-white/80 bg-white/95 px-6 py-8 shadow-[0_15px_50px_rgba(12,75,80,0.10)] backdrop-blur-sm sm:px-10 sm:py-10 lg:mr-[3%] lg:px-12">
        {/* Mobile brand */}
        <Link
          href="/"
          className="mb-7 flex items-center justify-center gap-2 lg:hidden"
        >
          <span className="text-xl font-bold text-[#123d4a]">NexoPod</span>
        </Link>

        {/* Authentication tabs */}
        <div
          className={`mb-8 grid border-b border-[#e1e9e9] ${
            registrationOpen ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          <Link
            href="/login"
            className={`border-b-[3px] py-3 text-center text-sm font-semibold transition ${
              mode === "login"
                ? "border-[#079d98] text-[#087d7b]"
                : "border-transparent text-[#718087] hover:text-[#123d4a]"
            }`}
          >
            Login
          </Link>

          {registrationOpen && (
            <Link
              href="/signup"
              className={`border-b-[3px] py-3 text-center text-sm font-semibold transition ${
                mode === "signup"
                  ? "border-[#079d98] text-[#087d7b]"
                  : "border-transparent text-[#718087] hover:text-[#123d4a]"
              }`}
            >
              Register
            </Link>
          )}
        </div>

        {children}
      </section>
    </main>
  );
}
