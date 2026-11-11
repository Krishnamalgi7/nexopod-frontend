
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ImagePlus,
    MapPin,
    Phone,
    Store,
    Upload,
    X,
    LoaderCircle,
    CheckCircle2,
    Plus,
} from "lucide-react";

import { createStore } from "@/services/storeService";

export default function AddStorePage() {
    const router = useRouter();

    const mainImageRef = useRef<HTMLInputElement>(null);
    const additionalImagesRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState("");
    const [addressLink, setAddressLink] = useState("");
    const [contactNumber, setContactNumber] = useState("");

    const [mainImage, setMainImage] = useState<File | null>(null);
    const [additionalImages, setAdditionalImages] = useState<File[]>([]);

    const [mainPreview, setMainPreview] = useState("");
    const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Release preview URLs when files change or component unmounts.
    useEffect(() => {
        return () => {
            if (mainPreview) URL.revokeObjectURL(mainPreview);
            additionalPreviews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [mainPreview, additionalPreviews]);

    const validateImage = (file: File) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            return "Only JPG, PNG and WEBP images are allowed.";
        }

        if (file.size > 5 * 1024 * 1024) {
            return "Each image must be smaller than 5 MB.";
        }

        return "";
    };

    const handleMainImage = (file?: File) => {
        if (!file) return;

        const validationError = validateImage(file);

        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setMainImage(file);
        setMainPreview(URL.createObjectURL(file));
    };

    const handleAdditionalImages = (
        files: FileList | null
    ) => {
        if (!files) return;

        setError("");

        const selectedFiles = Array.from(files);

        if (additionalImages.length + selectedFiles.length > 4) {
            setError("You can upload a maximum of 4 additional images.");
            return;
        }

        const validationError = selectedFiles
            .map(validateImage)
            .find(Boolean);

        if (validationError) {
            setError(validationError);
            return;
        }

        setAdditionalImages((previous) => [
            ...previous,
            ...selectedFiles,
        ]);

        setAdditionalPreviews((previous) => [
            ...previous,
            ...selectedFiles.map((file) => URL.createObjectURL(file)),
        ]);
    };

    const removeMainImage = () => {
        setMainImage(null);
        setMainPreview("");

        if (mainImageRef.current) {
            mainImageRef.current.value = "";
        }
    };

    const removeAdditionalImage = (index: number) => {
        setAdditionalImages((previous) =>
            previous.filter((_, i) => i !== index)
        );

        setAdditionalPreviews((previous) =>
            previous.filter((_, i) => i !== index)
        );
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!mainImage) {
            setError("Please upload the main store image.");
            return;
        }

        if (!/^\d{10}$/.test(contactNumber)) {
            setError("Enter a valid 10-digit contact number.");
            return;
        }

        try {
            const parsedUrl = new URL(addressLink);

            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                setError("Please enter a valid Google Maps link.");
                return;
            }
        } catch {
            setError("Please enter a valid Google Maps link.");
            return;
        }

        setLoading(true);

        try {
            const result = await createStore({
                name: name.trim(),
                addressLink: addressLink.trim(),
                contactNumber,
                image: mainImage,
                images: additionalImages,
            });

            setSuccess(result.message || "Store created successfully.");

            // Clear the form after successful creation.
            setName("");
            setAddressLink("");
            setContactNumber("");
            setMainImage(null);
            setAdditionalImages([]);
            setMainPreview("");
            setAdditionalPreviews([]);

            if (mainImageRef.current) {
                mainImageRef.current.value = "";
            }

            if (additionalImagesRef.current) {
                additionalImagesRef.current.value = "";
            }

            // Return to the dashboard after successful creation.
            setTimeout(() => {
                router.push("/dashboard");
            }, 1200);

        } catch (err) {
            console.error("Store creation failed:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create store. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f4f9f8] px-4 py-8 sm:px-6">

            <div className="mx-auto max-w-6xl">

                <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="mb-7 flex items-center gap-2 text-sm font-medium text-[#536b72] hover:text-[#079d98]"
                >
                    <ArrowLeft size={18} />
                    Back to dashboard
                </button>

                <div className="mb-8">
                    <div className="flex items-center gap-2 text-[#079d98]">
                        <Store size={19} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Store management
                        </span>
                    </div>

                    <h1 className="mt-3 text-3xl font-bold text-[#123d4a]">
                        Add a new store
                    </h1>

                    <p className="mt-2 text-sm text-[#70858a]">
                        Enter your store details and upload its images.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-7 rounded-2xl border border-[#e3edeb] bg-white p-5 shadow-sm sm:p-8"
                >

                    {/* Store name */}
                    <div>
                        <label
                            htmlFor="store-name"
                            className="mb-2 block text-sm font-semibold text-[#123d4a]"
                        >
                            Store name *
                        </label>

                        <div className="flex items-center rounded-xl border border-[#dce7e5] px-4 focus-within:border-[#079d98]">
                            <Store size={18} className="text-[#829397]" />

                            <input
                                id="store-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter store name"
                                minLength={2}
                                maxLength={100}
                                required
                                className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                            />
                        </div>
                    </div>

                    {/* Google Maps link */}
                    <div>
                        <label
                            htmlFor="store-address"
                            className="mb-2 block text-sm font-semibold text-[#123d4a]"
                        >
                            Google Maps address link *
                        </label>

                        <div className="flex items-center rounded-xl border border-[#dce7e5] px-4 focus-within:border-[#079d98]">
                            <MapPin size={18} className="shrink-0 text-[#829397]" />

                            <input
                                id="store-address"
                                type="url"
                                value={addressLink}
                                onChange={(e) => setAddressLink(e.target.value)}
                                placeholder="Paste Google Maps link"
                                required
                                className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                            />
                        </div>

                        <p className="mt-2 text-xs text-[#929e9f]">
                            Copy the location's share link from Google Maps.
                        </p>
                    </div>

                    {/* Contact number */}
                    <div>
                        <label
                            htmlFor="store-phone"
                            className="mb-2 block text-sm font-semibold text-[#123d4a]"
                        >
                            Contact number *
                        </label>

                        <div className="flex items-center rounded-xl border border-[#dce7e5] px-4 focus-within:border-[#079d98]">
                            <Phone size={18} className="text-[#829397]" />

                            <span className="border-r border-[#e5ebea] px-3 py-3.5 text-sm text-[#536b72]">
                                +91
                            </span>

                            <input
                                id="store-phone"
                                type="tel"
                                value={contactNumber}
                                onChange={(e) =>
                                    setContactNumber(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 10)
                                    )
                                }
                                placeholder="10-digit phone number"
                                required
                                maxLength={10}
                                inputMode="numeric"
                                className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                            />
                        </div>
                    </div>

                    {/* Main image */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-[#123d4a]">
                            Main store image *
                        </label>

                        <input
                            ref={mainImageRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                            onChange={(e) => handleMainImage(e.target.files?.[0])}
                        />

                        {mainPreview ? (
                            <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[#dce7e5]">
                                <img
                                    src={mainPreview}
                                    alt="Main store preview"
                                    className="h-52 w-full object-cover"
                                />

                                <button
                                    type="button"
                                    onClick={removeMainImage}
                                    aria-label="Remove main image"
                                    className="absolute right-3 top-3 rounded-full bg-white p-2 text-red-600 shadow"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => mainImageRef.current?.click()}
                                className="flex w-full max-w-sm flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cbdedb] bg-[#f8fcfb] px-5 py-10 text-center hover:border-[#079d98]"
                            >
                                <Upload size={25} className="text-[#079d98]" />
                                <span className="mt-3 text-sm font-semibold text-[#123d4a]">
                                    Upload main image
                                </span>
                                <span className="mt-1 text-xs text-[#829397]">
                                    JPG, PNG or WEBP · Maximum 5 MB
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Additional images */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-semibold text-[#123d4a]">
                                Additional images
                            </label>

                            <span className="text-xs text-[#829397]">
                                {additionalImages.length}/4
                            </span>
                        </div>

                        <input
                            ref={additionalImagesRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            hidden
                            onChange={(e) => {
                                handleAdditionalImages(e.target.files);
                                e.target.value = "";
                            }}
                        />

                        <div className="flex flex-wrap gap-3">

                            {additionalPreviews.map((preview, index) => (
                                <div
                                    key={preview}
                                    className="relative h-24 w-24 overflow-hidden rounded-xl border border-[#dce7e5]"
                                >
                                    <img
                                        src={preview}
                                        alt={`Additional store image ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeAdditionalImage(index)}
                                        aria-label={`Remove additional image ${index + 1}`}
                                        className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-600 shadow"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {additionalImages.length < 4 && (
                                <button
                                    type="button"
                                    onClick={() => additionalImagesRef.current?.click()}
                                    className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cbdedb] bg-[#f8fcfb] text-[#079d98] hover:border-[#079d98]"
                                >
                                    <ImagePlus size={22} />
                                    <span className="mt-1 text-xs font-medium">
                                        Add image
                                    </span>
                                </button>
                            )}

                        </div>

                        <p className="mt-2 text-xs text-[#929e9f]">
                            You can upload up to four additional images.
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
                            className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
                        >
                            <CheckCircle2 size={18} />
                            {success}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#079d98] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#078b86] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <LoaderCircle size={18} className="animate-spin" />
                                Creating store...
                            </>
                        ) : (
                            <>
                                <Plus size={18} />
                                Create Store
                            </>
                        )}
                    </button>

                </form>
            </div>
        </main>
    );
}
