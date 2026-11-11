
import Link from "next/link";
import {
    Store,
    Plus,
    Zap,
    Clock3,
    UserRound,
    MapPin,
    ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-[#f4f9f8] text-[#123d4a]">

            {/* Main content */}
            <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">

                {/* Welcome section */}
                <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#079d98]">
                            Your workspace
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#123d4a] sm:text-4xl">
                            Welcome to NexoPod
                        </h1>

                        <p className="mt-3 text-sm text-[#70858a] sm:text-base">
                            Manage your stores and keep everything organised.
                        </p>
                    </div>

                    <Link
                        href="/dashboard/add-store"
                        className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#079d98] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#078b86]"
                    >
                        <Plus size={18} />
                        Add New Store
                    </Link>
                </section>

                {/* Stores section */}
                <section className="mt-12 sm:mt-14">

                    <div className="flex flex-col justify-between gap-3 border-b border-[#dfebea] pb-5 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-[#123d4a]">
                                Your Stores
                            </h2>

                            <p className="mt-1 text-sm text-[#829397]">
                                Manage all your store locations.
                            </p>
                        </div>

                        <span className="w-fit rounded-full bg-[#e4f5f2] px-3.5 py-1.5 text-xs font-semibold text-[#087d7b]">
                            My Locations
                        </span>
                    </div>

                    {/* Empty state */}
                    <div className="mt-6 flex flex-col items-center rounded-2xl border border-[#e3edeb] bg-white px-5 py-14 text-center shadow-[0_4px_20px_rgba(18,61,74,0.035)] sm:py-20">

                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf8f6] text-[#079d98]">
                            <MapPin size={29} strokeWidth={1.7} />
                        </div>

                        <h3 className="mt-5 text-lg font-semibold text-[#123d4a]">
                            No stores added yet
                        </h3>

                        <p className="mt-2 max-w-sm text-sm leading-6 text-[#829397]">
                            Your stores will appear here. Add your first
                            store to get started with NexoPod.
                        </p>

                        <Link
                            href="/dashboard/add-store"
                            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#079d98] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#078b86]"
                        >
                            <Plus size={18} />
                            Add Your First Store
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-16 flex flex-col items-center justify-between gap-2 border-t border-[#dfebea] py-6 text-xs text-[#829397] sm:flex-row">
                    <span className="font-semibold text-[#087d7b]">
                        NexoPod
                    </span>
                    <span>Manage your business in one place.</span>
                </footer>

            </div>
        </main>
    );
}
