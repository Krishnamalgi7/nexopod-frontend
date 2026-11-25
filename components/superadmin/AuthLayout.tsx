import Image from "next/image";
import Link from "next/link";
import { Crown } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  mode: "login" | "signup";
}

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#F0FFFA] px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1500px] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left illustration */}
        <section className="flex items-center justify-center">
          <div className="relative w-full max-w-[430px]">
            <Image
              src="/admin-auth.png"
              alt="NexoPod Super Admin Portal"
              width={1240}
              height={1240}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </section>

        {/* Right authentication area */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-[520px]">
            <div className="mb-7 flex flex-col items-center text-center">
              <Link href="/" className="inline-block">
                <h1 className="text-[38px] font-extrabold tracking-tight text-[#142D46]">
                  Nexo<span className="text-[#00BFA5]">Pod</span>
                </h1>
              </Link>
              <p className="mt-3 text-base text-[#64748B] sm:text-lg">
                Welcome! Access manage your stores
              </p>
            </div>

            <div className="rounded-[28px] border border-[#DCEFE8] bg-white p-6 shadow-[0_12px_40px_rgba(20,45,70,0.08)] sm:p-8">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
