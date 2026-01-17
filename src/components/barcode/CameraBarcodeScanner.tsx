"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, X, Loader2, SwitchCamera, Flashlight, FlashlightOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraBarcodeScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
    title?: string;
}

export function CameraBarcodeScanner({
    isOpen,
    onClose,
    onScan,
    title = "Scan Barcode",
}: CameraBarcodeScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
    const [hasFlash, setHasFlash] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !scannerRef.current) {
            initScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isOpen]);

    const initScanner = async () => {
        try {
            setIsScanning(true);
            setError(null);

            // Get available cameras
            const devices = await Html5Qrcode.getCameras();
            if (devices.length === 0) {
                setError("No cameras found on this device");
                setIsScanning(false);
                return;
            }

            setCameras(devices);

            // Prefer back camera
            const backCameraIndex = devices.findIndex(
                (d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear")
            );
            const cameraIndex = backCameraIndex >= 0 ? backCameraIndex : 0;
            setCurrentCameraIndex(cameraIndex);

            await startCamera(devices[cameraIndex].id);
        } catch (err: any) {
            console.error("Camera init error:", err);
            setError(err.message || "Failed to initialize camera");
            setIsScanning(false);
        }
    };

    const startCamera = async (cameraId: string) => {
        try {
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                } catch (e) {
                    // Ignore stop errors
                }
            }

            scannerRef.current = new Html5Qrcode("scanner-container", {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93,
                ],
                verbose: false,
                // @ts-ignore - Experimental feature for native speed
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            });

            const qrBoxSize = Math.min(window.innerWidth, window.innerHeight) * 0.7;

            await scannerRef.current.start(
                cameraId,
                {
                    fps: 60, // iPhone 12 Pro Max supports high FPS
                    qrbox: { width: qrBoxSize, height: qrBoxSize },
                    videoConstraints: {
                        facingMode: "environment",
                        focusMode: "continuous",
                        // Target iPhone 12 Pro Max 4K resolution
                        width: { min: 640, ideal: 3840, max: 4032 },
                        height: { min: 480, ideal: 2160, max: 3024 },
                        // Try to zoom in slightly to help with barcode focus
                        advanced: [{ zoom: 2.0 }]
                    } as any,
                },
                (decodedText) => {
                    // Success callback
                    setLastScanned(decodedText);
                    onScan(decodedText);

                    // Auto-close after successful scan with slight delay
                    setTimeout(() => {
                        stopScanner();
                        onClose();
                    }, 500);
                },
                () => {
                    // Error callback - ignore (continuously called when no code detected)
                }
            );

            setIsScanning(true);

            // Check for flash capability
            try {
                const capabilities = await scannerRef.current.getRunningTrackCameraCapabilities();
                setHasFlash(capabilities.torchFeature().isSupported());
            } catch (e) {
                // Fallback: assume no flash if we can't check
                setHasFlash(false);
            }
        } catch (err: any) {
            console.error("Camera start error:", err);
            setError(err.message || "Failed to start camera");
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                // Attempt to turn off flash before stopping
                if (flashOn) {
                    try {
                        await scannerRef.current.applyVideoConstraints({
                            advanced: [{ torch: false }]
                        } as any);
                    } catch (e) { /* ignore */ }
                }

                await scannerRef.current.stop();
            } catch (e) {
                // Ignore
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
        setFlashOn(false);
    };

    const switchCamera = async () => {
        if (cameras.length <= 1) return;

        const nextIndex = (currentCameraIndex + 1) % cameras.length;
        setCurrentCameraIndex(nextIndex);
        setFlashOn(false);
        await startCamera(cameras[nextIndex].id);
    };

    const toggleFlash = async () => {
        if (!scannerRef.current || !hasFlash) return;

        try {
            const newState = !flashOn;

            // modern robust way
            await scannerRef.current.applyVideoConstraints({
                advanced: [{ torch: newState }]
            } as any);

            setFlashOn(newState);
        } catch (e) {
            console.error("Flash toggle error:", e);
            // Fallback attempt with torchFeature
            try {
                const capabilities = await scannerRef.current.getRunningTrackCameraCapabilities();
                if (flashOn) {
                    await capabilities.torchFeature().disable();
                } else {
                    await capabilities.torchFeature().enable();
                }
                setFlashOn(!flashOn);
            } catch (fallbackErr) {
                console.error("Flash legacy toggle failed:", fallbackErr);
            }
        }
    };

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-black/50">
                    <h2 className="text-white font-medium">{title}</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-md aspect-square"
                    >
                        {/* Scanner Container */}
                        <div
                            id="scanner-container"
                            ref={containerRef}
                            className="w-full h-full rounded-2xl overflow-hidden bg-black"
                        />

                        {/* Scanning Frame Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                                    {/* Corner markers */}
                                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />

                                    {/* Scanning line animation */}
                                    {isScanning && (
                                        <motion.div
                                            className="absolute left-0 right-0 h-0.5 bg-green-500"
                                            animate={{ top: ["10%", "90%"] }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatType: "reverse",
                                                ease: "linear",
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Loading Overlay */}
                        {!isScanning && !error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl">
                                <div className="text-center text-white">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    <p>Starting camera...</p>
                                </div>
                            </div>
                        )}

                        {/* Error Overlay */}
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl">
                                <div className="text-center text-white px-4">
                                    <Camera className="w-12 h-12 mx-auto mb-3 text-red-400" />
                                    <p className="text-red-400 font-medium mb-2">Camera Error</p>
                                    <p className="text-sm text-white/70 mb-4">{error}</p>
                                    <button
                                        onClick={initScanner}
                                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Controls */}
                <div className="p-4 bg-black/50">
                    <div className="flex items-center justify-center gap-4">
                        {cameras.length > 1 && (
                            <button
                                onClick={switchCamera}
                                className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30"
                                title="Switch Camera"
                            >
                                <SwitchCamera className="w-6 h-6" />
                            </button>
                        )}
                        {hasFlash && (
                            <button
                                onClick={toggleFlash}
                                className={`p-3 rounded-full text-white hover:bg-white/30 ${flashOn ? "bg-yellow-500" : "bg-white/20"
                                    }`}
                                title={flashOn ? "Turn Off Flash" : "Turn On Flash"}
                            >
                                {flashOn ? (
                                    <Flashlight className="w-6 h-6" />
                                ) : (
                                    <FlashlightOff className="w-6 h-6" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Last scanned */}
                    {lastScanned && (
                        <div className="mt-4 text-center">
                            <p className="text-white/60 text-sm">Last scanned:</p>
                            <p className="text-green-400 font-mono">{lastScanned}</p>
                        </div>
                    )}

                    <p className="mt-4 text-center text-white/60 text-sm">
                        Point the camera at a barcode or QR code
                    </p>
                </div>
            </div>
        </AnimatePresence>
    );
}
