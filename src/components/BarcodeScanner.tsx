"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type DetectorClass = new (opts: { formats: string[] }) => Detector;

function getDetector(): DetectorClass | null {
  return typeof window !== "undefined" && "BarcodeDetector" in window
    ? (window as unknown as { BarcodeDetector: DetectorClass }).BarcodeDetector
    : null;
}

const noSubscribe = () => () => {};

/**
 * Scans product barcodes with the phone camera using the browser's built-in
 * BarcodeDetector (Chrome on Android, Safari 17+). Falls back to typing the number.
 */
export function BarcodeScanner({ onCode, busy }: { onCode: (code: string) => void; busy: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  const supported = useSyncExternalStore(
    noSubscribe,
    () => getDetector() != null && !!navigator.mediaDevices?.getUserMedia,
    () => false,
  );

  useEffect(() => {
    if (!scanning) return;
    const Detector = getDetector();
    if (!Detector) return;
    let stream: MediaStream | null = null;
    let stopped = false;
    const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        while (!stopped) {
          const found = await detector.detect(videoRef.current).catch(() => []);
          if (found[0]?.rawValue) {
            setScanning(false);
            onCode(found[0].rawValue);
            return;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch {
        setCameraError("Couldn't open the camera. Type the barcode number instead.");
        setScanning(false);
      }
    })();

    return () => {
      stopped = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning, onCode]);

  return (
    <div className="space-y-3">
      {supported && (
        <div className="space-y-2">
          {scanning ? (
            <>
              <video ref={videoRef} className="aspect-video w-full max-w-md rounded-lg bg-black object-cover" muted playsInline />
              <button className="btn-quiet" onClick={() => setScanning(false)}>
                Stop camera
              </button>
            </>
          ) : (
            <button className="btn" onClick={() => setScanning(true)} disabled={busy}>
              Scan with camera
            </button>
          )}
        </div>
      )}
      {cameraError && <p className="text-sm text-warn">{cameraError}</p>}
      <form
        className="flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.trim()) onCode(typed.trim());
        }}
      >
        <input
          className="input"
          inputMode="numeric"
          pattern="\d{8,14}"
          placeholder="Or type the barcode number"
          value={typed}
          onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))}
          aria-label="Barcode number"
        />
        <button className="btn-quiet" disabled={busy || typed.length < 8}>
          Look up
        </button>
      </form>
    </div>
  );
}
