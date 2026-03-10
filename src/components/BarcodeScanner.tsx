import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');
  const [hasCameras, setHasCameras] = useState<boolean>(true);

  useEffect(() => {
    let html5QrCode: Html5Qrcode;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          html5QrCode = new Html5Qrcode("reader");
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              onScan(decodedText);
              // We don't automatically close here, let the parent decide or close manually
            },
            (errorMessage) => {
              // Ignore scan errors as they happen constantly when no barcode is in view
            }
          );
        } else {
          setHasCameras(false);
          setError("No cameras found on this device.");
        }
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        setError(err?.message || "Failed to start camera. Please check permissions.");
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5" /> Scan Barcode
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm text-center">
            {error}
          </div>
        ) : !hasCameras ? (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl text-sm text-center">
            No cameras detected.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden bg-black aspect-square relative">
            <div id="reader" ref={scannerRef} className="w-full h-full"></div>
          </div>
        )}
        
        <p className="text-center text-xs text-slate-500 mt-4">
          Point your camera at a barcode or QR code.
        </p>
      </div>
    </div>
  );
}
