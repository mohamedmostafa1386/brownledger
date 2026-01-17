"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCcw, Mail } from "lucide-react";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to an error reporting service
        console.error("Application Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-red-500/5 p-4">
            <div className="text-center max-w-md">
                {/* Illustration */}
                <div className="relative mb-8">
                    <div className="text-[150px] font-bold text-red-500/10 leading-none">500</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-12 h-12 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-3xl font-bold mb-4">Something Went Wrong</h1>
                <p className="text-muted-foreground mb-2">
                    We encountered an unexpected error. Don't worry, your data is safe.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                    Error ID: {error.digest || "Unknown"}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Go to Dashboard
                    </Link>
                </div>

                {/* Support */}
                <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                        If this problem persists, please contact support:
                    </p>
                    <a
                        href="mailto:support@brownledger.com"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                        <Mail className="w-4 h-4" />
                        support@brownledger.com
                    </a>
                </div>

                {/* Technical Details (Development only) */}
                {process.env.NODE_ENV === "development" && (
                    <div className="mt-8 p-4 bg-muted rounded-lg text-left">
                        <p className="text-xs font-mono text-muted-foreground break-all">
                            {error.message}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
