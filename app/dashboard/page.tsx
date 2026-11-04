import Link from "next/link";
import {
  Store,
  Plus,
  Zap,
  Clock,
  UserRound,
  LayoutDashboard,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top Navbar */}

      {/* Floating Rounded Navbar */}
      <header className="sticky top-0 z-50 px-3 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white/95 px-4 py-3 shadow-lg shadow-gray-200/40 backdrop-blur-xl sm:rounded-full sm:px-5">
          {/* Logo */}
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-200">
              <Store size={21} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              NexoPod
            </span>
          </Link>

          {/* Navigation Buttons */}
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-hide sm:gap-2">
            <Link
              href="/dashboard/add-store"
              className="flex shrink-0 items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
            >
              <Plus size={17} />
              <span>Add Store</span>
            </Link>

            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <Zap size={18} />
              <span>Phone Charging</span>
            </button>

            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <Clock size={18} />
              <span>Pick Me Later</span>
            </button>
          </nav>

          {/* Profile */}
          <button
            type="button"
            aria-label="User profile"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <UserRound size={20} />
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Welcome to NexoPod
          </h1>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Manage and organize your stores from one place.
          </p>
        </div>

        {/* Stores Section */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Stores</h2>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your added stores.
            </p>
          </div>

          <Link
            href="/dashboard/add-store"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Store
          </Link>
        </div>

        {/* Empty State */}
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Store size={30} />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-gray-900">
            No stores added yet
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Get started by adding your first store. Your added stores will
            appear here.
          </p>

          <Link
            href="/dashboard/add-store"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Your First Store
          </Link>
        </div>
      </section>
    </main>
  );
}
