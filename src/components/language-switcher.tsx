"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, Check, Loader2 } from "lucide-react";
import { useLocaleStore } from "@/lib/stores/locale-store";

const languages = [
    { code: "en", name: "English", flag: "🇬🇧", dir: "ltr" },
    { code: "ar", name: "العربية", flag: "🇪🇬", dir: "rtl" },
];

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { setLocale: setStoreLocale, isRTL } = useLocaleStore();

    const switchLanguage = (newLocale: string) => {
        if (newLocale === locale) {
            setIsOpen(false);
            return;
        }

        // Update Zustand store IMMEDIATELY for instant UI change
        setStoreLocale(newLocale);

        // Close dropdown
        setIsOpen(false);

        // Navigate to new locale in transition
        startTransition(() => {
            // Remove current locale prefix if present
            const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "") || "/";
            router.push(pathWithoutLocale);
            router.refresh();
        });
    };

    const currentLang = languages.find((l) => l.code === locale) || languages[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                data-testid="language-switcher"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
                {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Languages className="w-4 h-4" />
                )}
                <span className="text-lg">{currentLang.flag}</span>
                <span className="hidden sm:inline text-sm font-medium">
                    {currentLang.name}
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown - RTL aware positioning */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute top-full mt-2 ${isRTL ? 'left-0' : 'right-0'} bg-card rounded-lg shadow-lg border z-50 min-w-[180px] overflow-hidden`}
                        >
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => switchLanguage(lang.code)}
                                    disabled={isPending}
                                    className={`w-full px-4 py-3 text-start hover:bg-muted flex items-center justify-between gap-3 transition-colors disabled:opacity-50 ${locale === lang.code ? "bg-primary/10 text-primary" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{lang.flag}</span>
                                        <span className="font-medium">{lang.name}</span>
                                    </div>
                                    {locale === lang.code && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

