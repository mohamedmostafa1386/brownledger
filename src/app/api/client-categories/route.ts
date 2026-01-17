import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

// GET all client categories for a company
export async function GET(req: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get("parentId");
        const includeChildren = searchParams.get("includeChildren") === "true";

        const categories = await prisma.clientCategory.findMany({
            where: {
                companyId,
                ...(parentId === "null" ? { parentId: null } : parentId ? { parentId } : {}),
            },
            include: {
                parent: true,
                children: includeChildren,
                _count: {
                    select: { clients: true },
                },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching client categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

// POST create a new client category
export async function POST(req: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await req.json();
        const { name, nameAr, description, color, parentId } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Check for duplicate name
        const existing = await prisma.clientCategory.findUnique({
            where: {
                companyId_name: {
                    companyId,
                    name,
                },
            },
        });

        if (existing) {
            return NextResponse.json({ error: "Category with this name already exists" }, { status: 400 });
        }

        // If parentId is provided, verify it exists and belongs to the same company
        if (parentId) {
            const parent = await prisma.clientCategory.findFirst({
                where: {
                    id: parentId,
                    companyId,
                },
            });
            if (!parent) {
                return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
            }
        }

        const category = await prisma.clientCategory.create({
            data: {
                companyId,
                name,
                nameAr,
                description,
                color,
                parentId,
            },
            include: {
                parent: true,
                children: true,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error creating client category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}

// PUT update a client category
export async function PUT(req: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await req.json();
        const { id, name, nameAr, description, color, parentId } = body;

        if (!id) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        // Verify category exists and belongs to this company
        const existing = await prisma.clientCategory.findFirst({
            where: {
                id,
                companyId,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Prevent setting parent to self or circular reference
        if (parentId === id) {
            return NextResponse.json({ error: "Category cannot be its own parent" }, { status: 400 });
        }

        // Check for name collision (if name changed)
        if (name && name !== existing.name) {
            const duplicate = await prisma.clientCategory.findUnique({
                where: {
                    companyId_name: {
                        companyId,
                        name,
                    },
                },
            });
            if (duplicate) {
                return NextResponse.json({ error: "Category with this name already exists" }, { status: 400 });
            }
        }

        const category = await prisma.clientCategory.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(nameAr !== undefined && { nameAr }),
                ...(description !== undefined && { description }),
                ...(color !== undefined && { color }),
                ...(parentId !== undefined && { parentId }),
            },
            include: {
                parent: true,
                children: true,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating client category:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

// DELETE a client category
export async function DELETE(req: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        // Verify category exists and belongs to this company
        const existing = await prisma.clientCategory.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                _count: {
                    select: { clients: true, children: true },
                },
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Check if category has clients
        if (existing._count.clients > 0) {
            return NextResponse.json(
                { error: `Cannot delete category with ${existing._count.clients} assigned clients` },
                { status: 400 }
            );
        }

        // Check if category has children
        if (existing._count.children > 0) {
            return NextResponse.json(
                { error: `Cannot delete category with ${existing._count.children} subcategories` },
                { status: 400 }
            );
        }

        await prisma.clientCategory.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting client category:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
