"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
    const t = useTranslations('auth.forgotPassword');
    const tErrors = useTranslations('auth.errors');
    const params = useParams();
    const locale = params.locale as string;
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSent(true);
            } else {
                setError(data.error || tErrors('generic'));
            }
        } catch (err) {
            setError(tErrors('generic'));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-card rounded-2xl border border-border p-8 shadow-lg text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">{t('successTitle')}</h1>
                        <p className="text-muted-foreground mb-6">
                            {t('successMessage')} <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            {t('successNote')}
                        </p>
                        <Link
                            href={`/${locale}/login`}
                            className="flex items-center justify-center gap-2 text-primary hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('backToLogin')}
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
                        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
                        <p className="text-muted-foreground">
                            {t('subtitle')}
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
                            <label className="block text-sm font-medium mb-2">{t('emailWidthIcon')}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? t('sending') : t('submit')}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            href={`/${locale}/login`}
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('backToLogin')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
