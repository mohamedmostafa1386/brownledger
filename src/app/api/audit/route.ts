import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

interface AuditEvent {
    id: string;
    timestamp: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName: string;
    userId: string;
    userName: string;
    changes: any;
    ipAddress: string;
}

// GET - Fetch audit trail entries
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canViewAuditLogs(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants or admins can view audit logs" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get("entityType");
        const entityId = searchParams.get("entityId");
        const limit = parseInt(searchParams.get("limit") || "50");
        const page = parseInt(searchParams.get("page") || "1");

        // For a real implementation, we'd have an AuditLog model in Prisma
        // For now, we'll generate sample data based on actual records

        // Get recent activities from various tables
        const [invoices, expenses, journalEntries, clients] = await Promise.all([
            prisma.invoice.findMany({
                where: { companyId },
                orderBy: { updatedAt: "desc" },
                take: 10,
                include: { client: { select: { name: true } } },
            }),
            prisma.expense.findMany({
                where: { companyId },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            prisma.journalEntry.findMany({
                where: { companyId },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            prisma.client.findMany({
                where: { companyId },
                orderBy: { updatedAt: "desc" },
                take: 10,
            }),
        ]);

        // Generate audit events from actual data
        const auditEvents: AuditEvent[] = [];

        invoices.forEach((inv) => {
            auditEvents.push({
                id: `audit-inv-${inv.id}`,
                timestamp: inv.updatedAt.toISOString(),
                action: inv.createdAt.getTime() === inv.updatedAt.getTime() ? "CREATE" : "UPDATE",
                entityType: "INVOICE",
                entityId: inv.id,
                entityName: `Invoice ${inv.invoiceNumber}`,
                userId: "user-1",
                userName: "System User",
                changes: {
                    status: inv.status,
                    subtotal: inv.subtotal,
                    client: inv.client?.name,
                },
                ipAddress: "127.0.0.1",
            });
        });

        expenses.forEach((exp) => {
            auditEvents.push({
                id: `audit-exp-${exp.id}`,
                timestamp: exp.createdAt.toISOString(),
                action: "CREATE",
                entityType: "EXPENSE",
                entityId: exp.id,
                entityName: exp.description.substring(0, 30),
                userId: "user-1",
                userName: "System User",
                changes: {
                    amount: exp.amount,
                    date: exp.date,
                },
                ipAddress: "127.0.0.1",
            });
        });

        journalEntries.forEach((je) => {
            auditEvents.push({
                id: `audit-je-${je.id}`,
                timestamp: je.createdAt.toISOString(),
                action: "CREATE",
                entityType: "JOURNAL_ENTRY",
                entityId: je.id,
                entityName: `Journal ${je.journalNumber}`,
                userId: "user-1",
                userName: "System User",
                changes: {
                    description: je.description,
                    status: je.status,
                },
                ipAddress: "127.0.0.1",
            });
        });

        clients.forEach((cl) => {
            auditEvents.push({
                id: `audit-cl-${cl.id}`,
                timestamp: cl.updatedAt.toISOString(),
                action: cl.createdAt.getTime() === cl.updatedAt.getTime() ? "CREATE" : "UPDATE",
                entityType: "CLIENT",
                entityId: cl.id,
                entityName: cl.name,
                userId: "user-1",
                userName: "System User",
                changes: {
                    email: cl.email,
                    phone: cl.phone,
                },
                ipAddress: "127.0.0.1",
            });
        });

        // Sort by timestamp
        auditEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Filter by entity type if specified
        const filteredEvents = entityType
            ? auditEvents.filter((e) => e.entityType === entityType)
            : auditEvents;

        // Paginate
        const paginatedEvents = filteredEvents.slice((page - 1) * limit, page * limit);

        // Get summary stats
        const stats = {
            totalEvents: filteredEvents.length,
            todayEvents: filteredEvents.filter(
                (e) => new Date(e.timestamp).toDateString() === new Date().toDateString()
            ).length,
            actionCounts: {
                CREATE: filteredEvents.filter((e) => e.action === "CREATE").length,
                UPDATE: filteredEvents.filter((e) => e.action === "UPDATE").length,
                DELETE: filteredEvents.filter((e) => e.action === "DELETE").length,
            },
            entityCounts: {
                INVOICE: filteredEvents.filter((e) => e.entityType === "INVOICE").length,
                EXPENSE: filteredEvents.filter((e) => e.entityType === "EXPENSE").length,
                JOURNAL_ENTRY: filteredEvents.filter((e) => e.entityType === "JOURNAL_ENTRY").length,
                CLIENT: filteredEvents.filter((e) => e.entityType === "CLIENT").length,
            },
        };

        return NextResponse.json({
            events: paginatedEvents,
            stats,
            pagination: {
                page,
                limit,
                total: filteredEvents.length,
                pages: Math.ceil(filteredEvents.length / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching audit trail:", error);
        return NextResponse.json({ error: "Failed to fetch audit trail" }, { status: 500 });
    }
}
