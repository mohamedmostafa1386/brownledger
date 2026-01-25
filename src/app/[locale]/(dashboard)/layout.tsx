import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const session = await auth();
    const { locale } = await params;

    if (!session) {
        redirect(`/${locale}/login`);
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <DashboardShell>
                <Header />
                <main className="p-6">{children}</main>
            </DashboardShell>
        </div>
    );
}


