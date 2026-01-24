
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Retrieve user's dashboard config
export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { dashboardConfig: true },
        });

        return NextResponse.json(user?.dashboardConfig || null);
    } catch (error) {
        console.error("Failed to fetch dashboard config:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST: Save user's dashboard config
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();

        // Validate body structure briefly if needed, or trust the frontend builder
        // body should be { widgets: [...], layout: ... }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { dashboardConfig: body },
        });

        return NextResponse.json(updatedUser.dashboardConfig);
    } catch (error) {
        console.error("Failed to save dashboard config:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
