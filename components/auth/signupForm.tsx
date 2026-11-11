
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    UserRound,
    Phone,
    LockKeyhole,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    RefreshCw,
} from "lucide-react";

import {
    registerUser,
    getRegistrationStatus,
} from "@/services/authService";

type RegistrationState = "checking" | "open" | "closed" | "error";

export default function SignupForm() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [registrationState, setRegistrationState] =
        useState<RegistrationState>("checking");

    const checkRegistration = async () => {
        setRegistrationState("checking");

        try {
            const result = await getRegistrationStatus();

            setRegistrationState(
                result.data.registrationOpen ? "open" : "closed"
            );
        } catch (err) {
            console.error("Registration availability check failed:", err);
            setRegistrationState("error");
        }
    };

    useEffect(() => {
        checkRegistration();
    }, []);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!/^\d{10}$/.test(phone)) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            const result = await registerUser({
                name: name.trim(),
                phone,
                password,
            });

            setSuccess(
                result.message || "Your account has been created successfully."
            );

            setName("");
            setPhone("");
            setPassword("");

            await checkRegistration();
        } catch (err) {
            console.error("Registration failed:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Registration failed. Please try again."
            );

            // Check whether another account has already been created.
            try {
                const result = await getRegistrationStatus();

                setRegistrationState(
                    result.data.registrationOpen ? "open" : "closed"
                );
            } catch {
                // Keep the current page state if the status check fails.
            }
        } finally {
            setLoading(false);
        }
    };

    // Checking registration availability
    if (registrationState === "checking") {
        return (
            <div className="py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ed] text-[#385640]">
                    <RefreshCw size={22} className="animate-spin" />
                </div>

                <p className="mt-5 text-sm font-medium text-[#59645a]">
                    Checking registration availability...
                </p>
            </div>
        );
    }

    // Registration status unavailable
    if (registrationState === "error") {
        return (
            <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <RefreshCw size={24} />
                </div>

                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#26352b]">
                    Unable to connect
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#788078]">
                    We couldn't check registration availability.
                    Please try again.
                </p>

                <button
                    type="button"
                    onClick={checkRegistration}
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#263d30] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#385640]"
                >
                    Try again
                    <RefreshCw size={16} />
                </button>
            </div>
        );
    }

    // Registration is already closed
    if (registrationState === "closed") {
        return (
            <div className="py-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf2ed] text-[#385640]">
                    <ShieldCheck size={30} strokeWidth={1.6} />
                </div>

                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-[#819080]">
                    Private access
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#26352b]">
                    Registration is closed.
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#788078]">
                    The NexoPod Store Creator account has already
                    been registered. New account creation is not
                    available.
                </p>

                <div className="mt-7 rounded-xl border border-[#e7ebe5] bg-[#f8f9f6] p-4">
                    <p className="text-sm font-semibold text-[#39483b]">
                        Already have an account?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#838b82]">
                        Sign in using your registered phone number
                        and password.
                    </p>
                </div>

                <Link
                    href="/login"
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#263d30] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#385640]"
                >
                    Go to login
                    <ArrowRight size={17} />
                </Link>
            </div>
        );
    }

    // Registration form
    return (
        <div>
            <div className="mb-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#819080]">
                    Create your workspace
                </p>

                <h2 className="text-3xl font-semibold tracking-[-0.055em] text-[#26352b] sm:text-4xl">
                    Create your account
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#838b82]">
                    Set up your NexoPod Store Creator account.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name */}
                <div>
                    <label
                        htmlFor="signup-name"
                        className="mb-2 block text-sm font-medium text-[#414b42]"
                    >
                        Full name
                    </label>

                    <div className="flex items-center rounded-xl border border-[#e2e7e1] bg-white px-4 transition focus-within:border-[#617d65] focus-within:ring-2 focus-within:ring-[#617d65]/10">
                        <UserRound size={18} className="shrink-0 text-[#929c91]" />

                        <input
                            id="signup-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Enter your full name"
                            required
                            minLength={2}
                            maxLength={100}
                            autoComplete="name"
                            className="w-full bg-transparent px-3 py-3.5 text-sm text-[#26352b] outline-none placeholder:text-[#a5aca4]"
                        />
                    </div>
                </div>

                {/* Phone */}
                <div>
                    <label
                        htmlFor="signup-phone"
                        className="mb-2 block text-sm font-medium text-[#414b42]"
                    >
                        Phone number
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-[#e2e7e1] bg-white transition focus-within:border-[#617d65] focus-within:ring-2 focus-within:ring-[#617d65]/10">
                        <span className="flex items-center gap-2 border-r border-[#e8ebe6] bg-[#f8f9f6] px-3 text-sm font-medium text-[#59645a]">
                            <Phone size={16} />
                            +91
                        </span>

                        <input
                            id="signup-phone"
                            type="tel"
                            value={phone}
                            onChange={(event) =>
                                setPhone(
                                    event.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 10)
                                )
                            }
                            placeholder="10-digit mobile number"
                            required
                            minLength={10}
                            maxLength={10}
                            pattern="[0-9]{10}"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            className="w-full bg-transparent px-3 py-3.5 text-sm text-[#26352b] outline-none placeholder:text-[#a5aca4]"
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label
                        htmlFor="signup-password"
                        className="mb-2 block text-sm font-medium text-[#414b42]"
                    >
                        Password
                    </label>

                    <div className="flex items-center rounded-xl border border-[#e2e7e1] bg-white px-4 transition focus-within:border-[#617d65] focus-within:ring-2 focus-within:ring-[#617d65]/10">
                        <LockKeyhole size={18} className="shrink-0 text-[#929c91]" />

                        <input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Create a password"
                            required
                            minLength={8}
                            maxLength={72}
                            autoComplete="new-password"
                            className="w-full bg-transparent px-3 py-3.5 text-sm text-[#26352b] outline-none placeholder:text-[#a5aca4]"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                            className="shrink-0 text-[#929c91] transition hover:text-[#263d30]"
                        >
                            {showPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>

                    <p className="mt-2 text-xs text-[#929a91]">
                        Use at least 8 characters.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                    >
                        {error}
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div
                        role="status"
                        className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
                    >
                        {success}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#263d30] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#385640] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <>
                            <RefreshCw size={17} className="animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        <>
                            Create account
                            <ArrowRight size={17} />
                        </>
                    )}
                </button>
            </form>

            <p className="mt-7 text-center text-sm text-[#838b82]">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-[#385640] hover:underline"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}
