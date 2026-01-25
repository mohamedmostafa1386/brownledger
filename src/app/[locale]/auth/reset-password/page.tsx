"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const locale = params.locale as string;
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    useEffect(() => {
        if (!token || !email) {
            setError("Invalid or expired reset link");
        }
    }, [token, email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token, newPassword: password }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(() => router.push(`/${locale}/login`), 3000);
            } else {
                setError(data.error || "Failed to reset password");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card rounded-2xl border border-border p-8 shadow-lg text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
                        <p className="text-muted-foreground mb-6">
                            Your password has been successfully reset. Redirecting to login...
                        </p>
                        <Link
                            href={`/${locale}/login`}
                            className="text-primary hover:underline"
                        >
                            Go to Login Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!token || !email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card rounded-2xl border border-border p-8 shadow-lg text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
                        <p className="text-muted-foreground mb-6">
                            This password reset link is invalid or has expired.
                        </p>
                        <Link
                            href={`/${locale}/auth/forgot-password`}
                            className="text-primary hover:underline"
                        >
                            Request a new reset link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-xl font-bold text-primary-foreground">BL</span>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
                        <p className="text-muted-foreground">
                            Create a new password for your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="text-sm text-muted-foreground">
                            <p className="mb-2">Password must:</p>
                            <ul className="space-y-1">
                                <li className={`flex items-center gap-2 ${password.length >= 6 ? "text-green-600" : ""}`}>
                                    {password.length >= 6 ? <CheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current" />}
                                    Be at least 6 characters
                                </li>
                                <li className={`flex items-center gap-2 ${password === confirmPassword && password.length > 0 ? "text-green-600" : ""}`}>
                                    {password === confirmPassword && password.length > 0 ? <CheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current" />}
                                    Match confirmation
                                </li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || password.length < 6 || password !== confirmPassword}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            href={`/${locale}/login`}
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
