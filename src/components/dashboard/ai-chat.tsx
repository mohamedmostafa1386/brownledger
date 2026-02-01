"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, X, Maximize2, Minimize2, HelpCircle, BookOpen, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { usePathname } from "next/navigation";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface HelpTopic {
    id: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    steps: string[];
    stepsAr: string[];
    relatedPages: string[];
}

// Comprehensive help topics for the accounting app
const HELP_TOPICS: HelpTopic[] = [
    {
        id: "create-invoice",
        title: "How to Create an Invoice",
        titleAr: "كيفية إنشاء فاتورة",
        description: "Learn how to create and send professional invoices to your clients",
        descriptionAr: "تعلم كيفية إنشاء وإرسال فواتير احترافية لعملائك",
        steps: [
            "Navigate to Invoices from the sidebar menu",
            "Click the 'New Invoice' button in the top right corner",
            "Select a client from the dropdown or add a new one",
            "Add line items with description, quantity, and price",
            "Review the total and tax calculations",
            "Click 'Save as Draft' or 'Send Invoice' to email it directly",
        ],
        stepsAr: [
            "انتقل إلى الفواتير من القائمة الجانبية",
            "انقر على زر 'فاتورة جديدة' في الزاوية العلوية اليمنى",
            "حدد عميلاً من القائمة المنسدلة أو أضف واحداَ جديداً",
            "أضف بنود الفاتورة مع الوصف والكمية والسعر",
            "راجع الإجمالي وحسابات الضريبة",
            "انقر على 'حفظ كمسودة' أو 'إرسال الفاتورة' لإرسالها بالبريد الإلكتروني مباشرة",
        ],
        relatedPages: ["/invoices", "/invoices/new"],
    },
    {
        id: "add-client",
        title: "How to Add a Client",
        titleAr: "كيفية إضافة عميل",
        description: "Add and manage your client database",
        descriptionAr: "إضافة وإدارة قاعدة بيانات عملائك",
        steps: [
            "Go to Clients from the sidebar",
            "Click 'Add Client' button",
            "Fill in the client details (name, email, phone, address)",
            "Optionally set credit limit and payment terms",
            "Click 'Save' to add the client",
            "The client will now appear in dropdowns when creating invoices",
        ],
        stepsAr: [
            "انتقل إلى العملاء من القائمة الجانبية",
            "انقر على زر 'إضافة عميل'",
            "أدخل تفاصيل العميل (الاسم، البريد الإلكتروني، الهاتف، العنوان)",
            "اختيارياً: حدد حد الائتمان وشروط الدفع",
            "انقر على 'حفظ' لإضافة العميل",
            "سيظهر العميل الآن في القوائم المنسدلة عند إنشاء الفواتير",
        ],
        relatedPages: ["/clients"],
    },
    {
        id: "record-expense",
        title: "How to Record an Expense",
        titleAr: "كيفية تسجيل مصروف",
        description: "Track and categorize your business expenses",
        descriptionAr: "تتبع وتصنيف مصروفات عملك",
        steps: [
            "Navigate to Expenses from the sidebar",
            "Click 'Add Expense' or use 'Scan Receipt' for AI-powered OCR",
            "Enter the vendor name, date, and amount",
            "Select an expense category (Office, Travel, Marketing, etc.)",
            "Optionally attach a receipt image",
            "Click 'Save' to record the expense",
        ],
        stepsAr: [
            "انتقل إلى المصروفات من القائمة الجانبية",
            "انقر على 'إضافة مصروف' أو استخدم 'مسح الإيصال' للتعرف الضوئي بالذكاء الاصطناعي",
            "أدخل اسم المورد والتاريخ والمبلغ",
            "حدد فئة المصروف (مكتبية، سفر، تسويق، إلخ)",
            "اختيارياً: أرفق صورة الإيصال",
            "انقر على 'حفظ' لتسجيل المصروف",
        ],
        relatedPages: ["/expenses"],
    },
    {
        id: "pos-sale",
        title: "How to Make a POS Sale",
        titleAr: "كيفية إجراء مبيعات نقطة البيع",
        description: "Use the Point of Sale system for retail transactions",
        descriptionAr: "استخدم نظام نقطة البيع للمعاملات بالتجزئة",
        steps: [
            "Go to POS from the sidebar (or quick actions on Dashboard)",
            "Search for products using the search bar or barcode scanner",
            "Click products to add them to the cart",
            "Adjust quantities using + and - buttons",
            "Apply discounts if needed",
            "Select payment method (Cash, Card, or Split)",
            "Complete the transaction and print/email receipt",
        ],
        stepsAr: [
            "انتقل إلى نقطة البيع من القائمة الجانبية (أو الإجراءات السريعة في لوحة التحكم)",
            "ابحث عن المنتجات باستخدام شريط البحث أو ماسح الباركود",
            "انقر على المنتجات لإضافتها إلى سلة التسوق",
            "عدّل الكميات باستخدام أزرار + و -",
            "طبّق الخصومات إذا لزم الأمر",
            "حدد طريقة الدفع (نقداً، بطاقة، أو تقسيم)",
            "أكمل المعاملة واطبع/أرسل الإيصال بالبريد الإلكتروني",
        ],
        relatedPages: ["/pos"],
    },
    {
        id: "add-product",
        title: "How to Add a Product",
        titleAr: "كيفية إضافة منتج",
        description: "Add products to your inventory",
        descriptionAr: "إضافة منتجات إلى المخزون",
        steps: [
            "Navigate to Products from the sidebar",
            "Click 'Add Product' button",
            "Enter product name, SKU, and barcode (optional)",
            "Set cost price and selling price",
            "Configure tax rate and stock quantity",
            "Set low stock alert threshold",
            "Click 'Create' to save the product",
        ],
        stepsAr: [
            "انتقل إلى المنتجات من القائمة الجانبية",
            "انقر على زر 'إضافة منتج'",
            "أدخل اسم المنتج والرمز التعريفي والباركود (اختياري)",
            "حدد سعر التكلفة وسعر البيع",
            "اضبط نسبة الضريبة وكمية المخزون",
            "حدد حد تنبيه المخزون المنخفض",
            "انقر على 'إنشاء' لحفظ المنتج",
        ],
        relatedPages: ["/products"],
    },
    {
        id: "view-reports",
        title: "How to View Financial Reports",
        titleAr: "كيفية عرض التقارير المالية",
        description: "Access income statements, balance sheets, and more",
        descriptionAr: "الوصول إلى قائمة الدخل والميزانية العمومية والمزيد",
        steps: [
            "Go to Financial Statements from the sidebar",
            "Select the report type: Income Statement, Balance Sheet, or Trial Balance",
            "Choose the date range you want to analyze",
            "Toggle 'Comparative View' to compare with previous periods",
            "Use the Export button to download as PDF or Excel",
        ],
        stepsAr: [
            "انتقل إلى القوائم المالية من القائمة الجانبية",
            "حدد نوع التقرير: قائمة الدخل أو الميزانية العمومية أو ميزان المراجعة",
            "اختر الفترة الزمنية التي تريد تحليلها",
            "فعّل 'العرض المقارن' للمقارنة مع الفترات السابقة",
            "استخدم زر التصدير للتنزيل كملف PDF أو Excel",
        ],
        relatedPages: ["/financial-statements", "/reports"],
    },
    {
        id: "record-payment",
        title: "How to Record a Payment",
        titleAr: "كيفية تسجيل دفعة",
        description: "Record payments received from clients",
        descriptionAr: "تسجيل المدفوعات المستلمة من العملاء",
        steps: [
            "Go to Receivables from the sidebar",
            "Find the outstanding invoice",
            "Click 'Record Payment' button",
            "Enter the payment amount",
            "Select payment method and date",
            "Add payment reference if needed",
            "Click 'Save' to record the payment",
        ],
        stepsAr: [
            "انتقل إلى الذمم المدينة من القائمة الجانبية",
            "ابحث عن الفاتورة المستحقة",
            "انقر على زر 'تسجيل دفعة'",
            "أدخل مبلغ الدفعة",
            "حدد طريقة الدفع والتاريخ",
            "أضف مرجع الدفع إذا لزم الأمر",
            "انقر على 'حفظ' لتسجيل الدفعة",
        ],
        relatedPages: ["/receivables"],
    },
    {
        id: "create-bill",
        title: "How to Create a Bill",
        titleAr: "كيفية إنشاء فاتورة مورد",
        description: "Record bills from your suppliers",
        descriptionAr: "تسجيل الفواتير من الموردين",
        steps: [
            "Navigate to Bills from the sidebar",
            "Click 'New Bill' button",
            "Select the supplier",
            "Enter bill number and dates",
            "Add line items with amounts",
            "Review totals and save",
        ],
        stepsAr: [
            "انتقل إلى فواتير الموردين من القائمة الجانبية",
            "انقر على زر 'فاتورة جديدة'",
            "حدد المورد",
            "أدخل رقم الفاتورة والتواريخ",
            "أضف بنود الفاتورة مع المبالغ",
            "راجع الإجماليات واحفظ",
        ],
        relatedPages: ["/bills"],
    },
    {
        id: "journal-entry",
        title: "How to Create a Journal Entry",
        titleAr: "كيفية إنشاء قيد يومية",
        description: "Record manual accounting adjustments",
        descriptionAr: "تسجيل التعديلات المحاسبية اليدوية",
        steps: [
            "Go to Journal Entries from the sidebar",
            "Click 'New Entry' button",
            "Enter a description for the entry",
            "Add debit and credit accounts with amounts",
            "Ensure debits equal credits (balanced)",
            "Click 'Post' to record the entry",
        ],
        stepsAr: [
            "انتقل إلى قيود اليومية من القائمة الجانبية",
            "انقر على زر 'قيد جديد'",
            "أدخل وصفاً للقيد",
            "أضف حسابات المدين والدائن مع المبالغ",
            "تأكد من تساوي المدين والدائن (القيد متوازن)",
            "انقر على 'ترحيل' لتسجيل القيد",
        ],
        relatedPages: ["/journal-entries"],
    },
    {
        id: "change-language",
        title: "How to Change Language",
        titleAr: "كيفية تغيير اللغة",
        description: "Switch between English, Arabic, and French",
        descriptionAr: "التبديل بين الإنجليزية والعربية والفرنسية",
        steps: [
            "Go to Settings from the sidebar",
            "Click on 'Language & Region' tab",
            "Select your preferred language",
            "The interface will update immediately",
            "Arabic enables right-to-left (RTL) layout",
        ],
        stepsAr: [
            "انتقل إلى الإعدادات من القائمة الجانبية",
            "انقر على تبويب 'اللغة والمنطقة'",
            "حدد لغتك المفضلة",
            "سيتم تحديث الواجهة فوراً",
            "العربية تفعّل تخطيط من اليمين لليسار (RTL)",
        ],
        relatedPages: ["/settings"],
    },
];

export function AIChat() {
    const { t, locale } = useI18n();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<"chat" | "help">("help");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Filter topics based on search and current page
    const filteredTopics = HELP_TOPICS.filter(topic => {
        const title = locale === "ar" ? topic.titleAr : topic.title;
        const description = locale === "ar" ? topic.descriptionAr : topic.description;
        const matchesSearch = searchQuery === "" ||
            title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Get contextual topics based on current page
    const contextualTopics = HELP_TOPICS.filter(topic =>
        topic.relatedPages.some(page => pathname.startsWith(page))
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Get settings from localStorage
            const apiKey = localStorage.getItem("openrouter_api_key") || "";
            const model = localStorage.getItem("openrouter_model") || "google/gemini-2.0-flash-exp:free";

            // Add context about the app to help the AI
            const systemContext = `You are a helpful accounting assistant for BrownLedger, a comprehensive accounting and business management application. 
You help users with:
- Creating and managing invoices
- Recording expenses and tracking budgets
- Managing clients and suppliers
- Using the Point of Sale (POS) system
- Understanding financial reports and ratios
- Recording journal entries and managing the chart of accounts
- Stock and inventory management

Always provide clear, step-by-step instructions. Be concise and practical.
If the user asks in Arabic, respond in Arabic.
Current page: ${pathname}`;

            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: systemContext },
                        ...messages.map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                        { role: "user", content: input },
                    ],
                    apiKey,
                    model,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to get response");
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let assistantContent = "";

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "",
            };
            setMessages((prev) => [...prev, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantContent += chunk;

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMessage.id
                            ? { ...m, content: assistantContent }
                            : m
                    )
                );
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: errorMessage.includes("API key")
                        ? `⚠️ ${errorMessage}\n\nGo to Settings → AI Settings to add your OpenRouter API key.`
                        : `Sorry, I encountered an error: ${errorMessage}`,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickQuestions = locale === "ar" ? [
        "كيف أنشئ فاتورة؟",
        "كيف أضيف عميل جديد؟",
        "كيف أسجل مصروف؟",
        "كيف أستخدم نقطة البيع؟",
    ] : [
        "How do I create an invoice?",
        "How do I add a client?",
        "How do I record an expense?",
        "How do I use the POS?",
    ];

    if (!isOpen) {
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg hover:bg-primary/90"
                title={t("aiHelp.title")}
            >
                <HelpCircle className="h-6 w-6 text-primary-foreground" />
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={cn(
                    "fixed z-50 flex flex-col rounded-xl border border-border bg-card shadow-xl",
                    isExpanded
                        ? "bottom-4 right-4 left-4 top-20 md:left-auto md:w-[600px]"
                        : "bottom-6 right-6 h-[550px] w-[400px]"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <HelpCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{t("aiHelp.title")}</h3>
                            <p className="text-xs text-muted-foreground">{t("aiHelp.subtitle")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="rounded-lg p-2 hover:bg-muted"
                        >
                            {isExpanded ? (
                                <Minimize2 className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                            )}
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-lg p-2 hover:bg-muted"
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => { setActiveTab("help"); setSelectedTopic(null); }}
                        className={cn(
                            "flex-1 py-2 text-sm font-medium transition-colors",
                            activeTab === "help" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <BookOpen className="h-4 w-4 inline-block mr-1" />
                        {t("aiHelp.helpGuide")}
                    </button>
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={cn(
                            "flex-1 py-2 text-sm font-medium transition-colors",
                            activeTab === "chat" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Sparkles className="h-4 w-4 inline-block mr-1" />
                        {t("aiHelp.chat")}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "help" ? (
                        <div className="p-4">
                            {selectedTopic ? (
                                // Topic Detail View
                                <div>
                                    <button
                                        onClick={() => setSelectedTopic(null)}
                                        className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
                                    >
                                        ← {t("aiHelp.back")}
                                    </button>
                                    <h4 className="font-semibold text-lg mb-2">
                                        {locale === "ar" ? selectedTopic.titleAr : selectedTopic.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {locale === "ar" ? selectedTopic.descriptionAr : selectedTopic.description}
                                    </p>
                                    <div className="space-y-3">
                                        {(locale === "ar" ? selectedTopic.stepsAr : selectedTopic.steps).map((step, index) => (
                                            <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium">
                                                    {index + 1}
                                                </div>
                                                <p className="text-sm">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                // Topics List View
                                <div>
                                    {/* Search */}
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder={t("aiHelp.searchPlaceholder")}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>

                                    {/* Contextual Help */}
                                    {contextualTopics.length > 0 && searchQuery === "" && (
                                        <div className="mb-4">
                                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                                {t("aiHelp.helpForPage")}
                                            </h5>
                                            {contextualTopics.map(topic => (
                                                <button
                                                    key={topic.id}
                                                    onClick={() => setSelectedTopic(topic)}
                                                    className="w-full text-left p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 mb-2 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm text-primary">
                                                            {locale === "ar" ? topic.titleAr : topic.title}
                                                        </span>
                                                        <ChevronRight className="h-4 w-4 text-primary" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* All Topics */}
                                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                        {t("aiHelp.allTopics")}
                                    </h5>
                                    <div className="space-y-2">
                                        {filteredTopics.map(topic => (
                                            <button
                                                key={topic.id}
                                                onClick={() => setSelectedTopic(topic)}
                                                className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium text-sm">
                                                            {locale === "ar" ? topic.titleAr : topic.title}
                                                        </span>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {locale === "ar" ? topic.descriptionAr : topic.description}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Chat View
                        <div className="p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {t("aiHelp.greeting")}
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {quickQuestions.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => setInput(q)}
                                                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex gap-3",
                                        m.role === "user" ? "flex-row-reverse" : ""
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                                            m.role === "user"
                                                ? "bg-primary"
                                                : "bg-muted"
                                        )}
                                    >
                                        {m.role === "user" ? (
                                            <User className="h-4 w-4 text-primary-foreground" />
                                        ) : (
                                            <Bot className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div
                                        className={cn(
                                            "rounded-lg px-4 py-2 max-w-[80%]",
                                            m.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{m.content || "..."}</p>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                                        <Bot className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="bg-muted rounded-lg px-4 py-2">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input - only show for chat tab */}
                {activeTab === "chat" && (
                    <form onSubmit={handleSubmit} className="border-t border-border p-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={t("aiHelp.inputPlaceholder")}
                                className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
