import { NextResponse } from "next/server";

export type ApiError = {
    code: string;
    message: string;
    details?: any;
};

export function apiResponse<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

export function apiError(message: string, code: string = "INTERNAL_ERROR", status = 500, details?: any) {
    return NextResponse.json(
        {
            error: message, // Keep top-level error string for backward compatibility
            code,
            details
        },
        {
            status,
            headers: { "Content-Type": "application/json" }
        }
    );
}

export function notFoundError(message = "Resource not found") {
    return apiError(message, "NOT_FOUND", 404);
}

export function unauthorizedError(message = "Unauthorized") {
    return apiError(message, "UNAUTHORIZED", 401);
}

export function forbiddenError(message = "Forbidden") {
    return apiError(message, "FORBIDDEN", 403);
}

export function badRequestError(message: string, details?: any) {
    return apiError(message, "BAD_REQUEST", 400, details);
}
