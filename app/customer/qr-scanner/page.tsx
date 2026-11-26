"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  LoaderCircle,
  RefreshCw,
  ScanQrCode,
} from "lucide-react";
import API_BASE_URL from "@/services/common/api";

export default function CustomerQRScannerPage() {
  const router = useRouter();

  const scannerRef = useRef<any>(null);
  const processingRef = useRef(false);

  const [scannerKey, setScannerKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let scanner: any = null;

    const startScanner = async () => {
      try {
        setLoading(true);
        setError("");
        setCameraReady(false);
        processingRef.current = false;

        const { Html5Qrcode } = await import("html5-qrcode");

        if (cancelled) return;

        scanner = new Html5Qrcode("customer-qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const size = Math.floor(
                Math.min(viewfinderWidth, viewfinderHeight) * 0.75,
              );

              return {
                width: size,
                height: size,
              };
            },
            aspectRatio: 1,
            disableFlip: false,
          },
          async (decodedText: string) => {
            if (processingRef.current || cancelled) return;

            processingRef.current = true;
            setLoading(true);
            setError("");

            try {
              if (scanner.isScanning) {
                await scanner.stop();
              }

              const storeCode = decodedText.trim();

              const response = await fetch(
                `${API_BASE_URL}/api/public/stores/qr/${encodeURIComponent(storeCode)}`,
              );

              const result = await response.json();

              if (!response.ok || !result.success || !result.data?._id) {
                throw new Error(result.message || "Unable to find this store.");
              }

              if (!cancelled) {
                router.replace(
                  `/customer/store-details?storeId=${encodeURIComponent(result.data._id)}`,
                );
              }
            } catch (err) {
              if (!cancelled) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Unable to scan this store QR code.",
                );
                setLoading(false);
                processingRef.current = false;
              }
            }
          },
        );

        if (!cancelled) {
          setCameraReady(true);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to access your camera. Please allow camera permission.",
          );
          setLoading(false);
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;

      if (scanner) {
        const cleanupScanner = async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch (error) {
            console.warn("QR scanner cleanup:", error);
          } finally {
            try {
              scanner.clear();
            } catch {
              // Scanner may already be cleared.
            }
          }
        };

        void cleanupScanner();
      }

      scannerRef.current = null;
    };
  }, [scannerKey, router]);

  const handleRetry = useCallback(() => {
    setError("");
    setCameraReady(false);
    setLoading(true);
    setScannerKey((current) => current + 1);
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F8FA] px-4 pb-28 pt-5 text-[#142D46]">
      <div className="mx-auto w-full max-w-xl">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <h1 className="text-xl font-bold">Scan Store QR</h1>
            <p className="text-xs text-[#7B8798]">
              Scan the QR code available at the shop
            </p>
          </div>
        </header>

        <section className="mt-7 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4F7F3]">
              <ScanQrCode size={30} className="text-[#00BFA5]" />
            </div>

            <h2 className="mt-4 text-lg font-bold">Scan to Visit Store</h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7B8798]">
              Position the shop's NexoPod QR code inside the scanning area.
              We'll take you directly to its store details.
            </p>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-2xl bg-[#142D46] p-3">
            <div
              id="customer-qr-reader"
              className="min-h-[300px] w-full overflow-hidden rounded-xl"
            />

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#142D46] text-center">
                <LoaderCircle
                  size={34}
                  className="animate-spin text-[#00BFA5]"
                />
                <p className="mt-3 text-sm font-medium text-white">
                  {error ? "Camera unavailable" : "Starting camera..."}
                </p>
              </div>
            )}

            {cameraReady && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[250px] w-[250px] rounded-2xl border-2 border-[#00BFA5] shadow-[0_0_0_999px_rgba(20,45,70,0.18)]" />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <CameraOff size={19} className="mt-0.5 shrink-0 text-red-500" />
                <p className="text-sm leading-5 text-red-700">{error}</p>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#142D46] px-4 py-3 text-sm font-semibold text-white"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          )}

          {!error && cameraReady && (
            <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-[#168B78]">
              <Camera size={17} />
              Camera is ready. Scan a store QR code.
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-[#7B8798]">
          Camera access is required to scan the store QR code. Allow camera
          permission when your browser asks.
        </p>
      </div>
    </main>
  );
}
