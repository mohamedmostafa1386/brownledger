/**
 * RBAC Foundation for multi-tenant access control
 * Refined for Internal Control Guidelines (Segregation of Duties)
 */

export type Role = "OWNER" | "ADMIN" | "ACCOUNTANT" | "MANAGER" | "CASHIER" | "VIEWER";

export const ROLES: Record<string, Role> = {
    OWNER: "OWNER",
    ADMIN: "ADMIN",
    ACCOUNTANT: "ACCOUNTANT",
    MANAGER: "MANAGER",
    CASHIER: "CASHIER",
    VIEWER: "VIEWER",
};

// Define hierarchy (higher rank can do everything lower rank can)
const ROLE_RANK: Record<Role, number> = {
    OWNER: 100,
    ADMIN: 80,
    ACCOUNTANT: 60,
    MANAGER: 40,
    CASHIER: 20,
    VIEWER: 0,
};

/**
 * Check if a role has the required minimum rank
 */
export function hasPermission(userRole: string | Role, requiredRole: Role): boolean {
    const userRoleTyped = userRole as Role;
    if (!(userRoleTyped in ROLE_RANK)) return false;
    return ROLE_RANK[userRoleTyped] >= ROLE_RANK[requiredRole];
}

/**
 * Module-level access mapping
 * Refined for Segregation of Duties (SoD):
 * - Cashiers: Limited to sales and local clients.
 * - Managers: Operations (Stock, POS) only. No access to recording financials or bank reconciliation.
 * - Accountants: Recording and Reporting only. No access to physical handling (POS) or administration (Team).
 */
export const modulePermissions: Record<string, Role[]> = {
    dashboard: ["OWNER", "ADMIN", "ACCOUNTANT", "MANAGER"],
    pos: ["OWNER", "ADMIN", "MANAGER", "CASHIER"],
    stock: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"], // Accountant needs view access for valuation
    invoices: ["OWNER", "ADMIN", "ACCOUNTANT", "MANAGER"],
    bills: ["OWNER", "ADMIN", "ACCOUNTANT"], // Only recording roles see bills
    expenses: ["OWNER", "ADMIN", "ACCOUNTANT"], // Managers only request, Accountants record
    financials: ["OWNER", "ADMIN", "ACCOUNTANT"], // Ledger, Trial Balance, Statements
    banking: ["OWNER", "ADMIN", "ACCOUNTANT"], // Reconciliations must be separate from operations
    audit: ["OWNER", "ADMIN", "ACCOUNTANT"],
    team: ["OWNER", "ADMIN"],
    settings: ["OWNER", "ADMIN"],
    clients: ["OWNER", "ADMIN", "ACCOUNTANT", "MANAGER", "CASHIER"],
    suppliers: ["OWNER", "ADMIN", "ACCOUNTANT", "MANAGER"],
    "purchase-orders": ["OWNER", "ADMIN", "ACCOUNTANT", "MANAGER"],
    reports: ["OWNER", "ADMIN", "ACCOUNTANT", "MANAGER", "VIEWER"],
};

/**
 * Helper to check if a user can access a specific module
 */
export function canAccessModule(role: string | Role, module: string): boolean {
    const allowedRoles = modulePermissions[module];
    if (!allowedRoles) return false;
    return allowedRoles.includes(role as Role);
}

/**
 * Common permission predicates (Internal Control focus)
 */
export const permissions = {
    canManageCompany: (role: string) => hasPermission(role, "ADMIN"),
    canViewFinancials: (role: string) => hasPermission(role, "ACCOUNTANT"),
    canManageInventory: (role: string) => hasPermission(role, "MANAGER"),
    canPerformSales: (role: string) => hasPermission(role, "CASHIER"),
    canPostJournals: (role: string) => hasPermission(role, "ACCOUNTANT"),
    canManageTeam: (role: string) => hasPermission(role, "ADMIN"),
    canReconcileBank: (role: string) => role === "OWNER" || role === "ADMIN" || role === "ACCOUNTANT",
    canViewAuditLogs: (role: string) => hasPermission(role, "ACCOUNTANT"),
    // Internal Control: Master Data Management (preventing procurement fraud)
    canManageSuppliers: (role: string) => hasPermission(role, "ACCOUNTANT"), // Accountants or Admins only
    canManageClients: (role: string) => hasPermission(role, "MANAGER"), // Managers can manage customers, Cashiers only view
    canManageAccounts: (role: string) => hasPermission(role, "ACCOUNTANT"),
};
