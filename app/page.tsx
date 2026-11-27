import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  UserRound,
  Waypoints,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Discover Services",
    description: "Explore services from nearby stores.",
  },
  {
    icon: CalendarDays,
    title: "Book Appointments",
    description: "Choose a time that works for you.",
  },
  {
    icon: MapPin,
    title: "Nearby Stores",
    description: "Find trusted stores around you.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8FCFC] text-[#142D46]">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-40 top-[58%] h-80 w-80 rounded-full bg-[#D7FAF1] blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#D8FBF6] blur-3xl" />

      {/* Header */}
      <header className="relative z-10 mb-7 mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-6 py-6 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-16">
        <Link href="/" className="flex items-center gap-4">
          <Waypoints size={43} strokeWidth={3} className="text-[#00BFA5]" />
          <span className="text-3xl font-extrabold tracking-tight">
            Nexo<span className="text-[#00BFA5]">Pod</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-3">
          <Link
            href="/shopowner/login"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#00B86B] px-5 py-3 text-sm font-bold text-[#009D60] transition hover:bg-[#E7FAF2] sm:px-7"
          >
            <Store size={19} />
            Login as Shop Owner
          </Link>

          <Link
            href="/superadmin/login"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#00B86B] px-5 py-3 text-sm font-bold text-[#009D60] transition hover:bg-[#EEF3F7] sm:px-7"
          >
            <ShieldCheck size={19} />
            Login as Admin
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid w-full max-w-[1440px] items-center gap-10 px-6 pb-12 pt-10 sm:px-10 lg:grid-cols-2 lg:gap-8 lg:px-16 lg:pb-16 lg:pt-12">
        <div className="max-w-[680px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-[#E2F9F1] px-5 py-3 text-sm font-bold text-[#009D60]">
            <UserRound size={19} />
            Conveninence at its best
          </div>

          <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[64px]">
            Book Services
            <br />
            Easily with <span className="text-[#00B58B]">NexoPod</span>
          </h1>

          <p className="mt-6 max-w-[600px] text-lg leading-relaxed text-[#59677D] sm:text-xl">
            Find nearby stores, explore services, and book appointments in just
            a few clicks.
          </p>

          <Link
            href="/customer/home"
            className="mt-9 inline-flex min-w-[220px] items-center justify-center gap-4 rounded-full bg-gradient-to-r from-[#00B58B] to-[#00A875] px-9 py-5 text-lg font-bold text-white shadow-[0_12px_25px_rgba(0,191,165,0.22)] transition hover:-translate-y-1 hover:shadow-lg"
          >
            Get Started
            <ArrowRight size={25} />
          </Link>
        </div>

        {/* Right-side illustration */}
        <div className="relative mx-auto flex w-full max-w-[590px] items-center justify-center">
          <div className="absolute aspect-square w-[80%] rounded-full bg-[#CFF9F0]" />
          <Image
            src="/nexopod-store-hero.png"
            alt="NexoPod local store illustration"
            width={1000}
            height={1000}
            priority
            className="relative z-10 h-auto w-full object-contain"
          />
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-8 px-6 pb-12 sm:px-10 md:grid-cols-3 lg:px-16 lg:pb-16">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className={`flex flex-col items-center px-4 text-center ${
                index !== 0 ? "md:border-l md:border-[#CBD5E1]" : ""
              }`}
            >
              <div className="mb-4 flex h-18 w-20 items-center justify-center rounded-[22px] bg-[#E0F9F1]">
                <Icon size={35} strokeWidth={2.5} className="text-[#00B58B]" />
              </div>

              <h2 className="text-xl font-extrabold sm:text-1xl">
                {feature.title}
              </h2>

              <p className="mt-2 text-base text-[#59677D] sm:text-lg">
                {feature.description}
              </p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
