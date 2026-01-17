import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { detectEntityType, mapColumns, EntityType } from "@/lib/migration/templates";
import { validateData, ValidationResult } from "@/lib/migration/validators";
import { importData, ImportResult } from "@/lib/migration/importers";

export interface MigrationSession {
    id: string;
    companyId: string;
    fileName: string;
    entityType: EntityType | null;
    columns: string[];
    columnMapping: Record<string, string>;
    data: Record<string, any>[];
    validation: ValidationResult | null;
    status: "analyzing" | "mapped" | "validated" | "importing" | "complete" | "error";
    result: ImportResult | null;
    createdAt: Date;
}

// In-memory session store (in production, use Redis or database)
const sessions = new Map<string, MigrationSession>();

// POST /api/migration - Handle file upload and analysis
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get company ID
        const membership = await prisma.companyMembership.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true },
        });

        if (!membership) {
            return NextResponse.json({ error: "No company found" }, { status: 400 });
        }

        const companyId = membership.companyId;

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const action = formData.get("action") as string;
        const sessionId = formData.get("sessionId") as string;

        // Handle different actions
        if (action === "analyze") {
            // Parse file
            const buffer = await file.arrayBuffer();
            const fileName = file.name.toLowerCase();

            let data: Record<string, any>[] = [];
            let columns: string[] = [];

            if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
                // Parse Excel
                const workbook = XLSX.read(buffer, { type: "array" });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

                if (jsonData.length > 0) {
                    columns = jsonData[0].map((c: any) => String(c || "").trim());
                    data = jsonData.slice(1).map(row => {
                        const obj: Record<string, any> = {};
                        columns.forEach((col, i) => {
                            obj[col] = row[i];
                        });
                        return obj;
                    });
                }
            } else if (fileName.endsWith(".csv")) {
                // Parse CSV
                const text = new TextDecoder().decode(buffer);
                const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
                data = parsed.data as Record<string, any>[];
                columns = parsed.meta.fields || [];
            } else {
                return NextResponse.json({ error: "Unsupported file format. Use .xlsx, .xls, or .csv" }, { status: 400 });
            }

            if (columns.length === 0) {
                return NextResponse.json({ error: "No data found in file" }, { status: 400 });
            }

            // Detect entity type
            const entityType = detectEntityType(columns);

            // Auto-map columns
            const columnMapping = entityType ? mapColumns(columns, entityType) : {};

            // Create session
            const migrationSession: MigrationSession = {
                id: crypto.randomUUID(),
                companyId,
                fileName: file.name,
                entityType,
                columns,
                columnMapping,
                data,
                validation: null,
                status: "analyzing",
                result: null,
                createdAt: new Date(),
            };

            sessions.set(migrationSession.id, migrationSession);

            return NextResponse.json({
                success: true,
                session: {
                    id: migrationSession.id,
                    fileName: file.name,
                    entityType,
                    columns,
                    columnMapping,
                    rowCount: data.length,
                    preview: data.slice(0, 5),
                },
            });
        }

        if (action === "validate" && sessionId) {
            const migrationSession = sessions.get(sessionId);
            if (!migrationSession) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            // Get updated mapping from form data
            const mappingJson = formData.get("mapping") as string;
            const entityType = formData.get("entityType") as EntityType;

            if (mappingJson) {
                migrationSession.columnMapping = JSON.parse(mappingJson);
            }
            if (entityType) {
                migrationSession.entityType = entityType;
            }

            if (!migrationSession.entityType) {
                return NextResponse.json({ error: "Please select a data type" }, { status: 400 });
            }

            // Validate data
            const validation = validateData(
                migrationSession.data,
                migrationSession.entityType,
                migrationSession.columnMapping
            );

            migrationSession.validation = validation;
            migrationSession.status = "validated";

            return NextResponse.json({
                success: true,
                validation,
            });
        }

        if (action === "import" && sessionId) {
            const migrationSession = sessions.get(sessionId);
            if (!migrationSession) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            if (!migrationSession.entityType) {
                return NextResponse.json({ error: "Please select a data type" }, { status: 400 });
            }

            migrationSession.status = "importing";

            // Import data
            const result = await importData(
                migrationSession.entityType,
                migrationSession.data,
                migrationSession.columnMapping,
                migrationSession.companyId
            );

            migrationSession.result = result;
            migrationSession.status = result.success ? "complete" : "error";

            return NextResponse.json({
                success: true,
                result,
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Migration failed"
        }, { status: 500 });
    }
}

// GET /api/migration - Get session status
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
        const migrationSession = sessions.get(sessionId);
        if (!migrationSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }
        return NextResponse.json({
            session: {
                id: migrationSession.id,
                fileName: migrationSession.fileName,
                entityType: migrationSession.entityType,
                status: migrationSession.status,
                validation: migrationSession.validation,
                result: migrationSession.result,
            },
        });
    }

    // Return available entity types
    return NextResponse.json({
        entityTypes: [
            { id: "clients", name: "Clients/Customers", icon: "👥" },
            { id: "suppliers", name: "Suppliers/Vendors", icon: "🏪" },
            { id: "accounts", name: "Chart of Accounts", icon: "📊" },
            { id: "opening_balances", name: "Opening Balances", icon: "💰" },
            { id: "invoices", name: "Invoices", icon: "📄", disabled: true },
            { id: "expenses", name: "Expenses", icon: "💸", disabled: true },
        ],
    });
}
