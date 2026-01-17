"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft, Search } from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <div className="text-center max-w-md">
                {/* Illustration */}
                <div className="relative mb-8">
                    <div className="text-[150px] font-bold text-primary/10 leading-none">404</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                            <FileQuestion className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
                <p className="text-muted-foreground mb-8">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Go to Dashboard
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Link href="/invoices" className="text-sm text-primary hover:underline">Invoices</Link>
                        <span className="text-muted-foreground">•</span>
                        <Link href="/expenses" className="text-sm text-primary hover:underline">Expenses</Link>
                        <span className="text-muted-foreground">•</span>
                        <Link href="/clients" className="text-sm text-primary hover:underline">Clients</Link>
                        <span className="text-muted-foreground">•</span>
                        <Link href="/reports" className="text-sm text-primary hover:underline">Reports</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
