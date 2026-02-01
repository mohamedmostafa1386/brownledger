"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import {
    Users,
    UserPlus,
    Mail,
    Shield,
    Trash2,
    MoreVertical,
    CheckCircle,
    Clock,
    X,
} from "lucide-react";

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    joinedAt: string;
}

export default function TeamPage() {
    const { t, locale } = useI18n();
    const queryClient = useQueryClient();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("ACCOUNTANT");
    const [isDirectAdd, setIsDirectAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // Fetch team members
    const { data, isLoading } = useQuery({
        queryKey: ["team"],
        queryFn: () => fetch("/api/team").then(r => r.json()),
    });

    // Send invite mutation
    const sendInvite = useMutation({
        mutationFn: (data: { email: string; role: string; name?: string; password?: string; directAdd?: boolean }) =>
            fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }).then(r => r.json()),
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ["team"] });
                setShowInviteModal(false);
                setInviteEmail("");
                setNewName("");
                setNewPassword("");
            }
        },
    });

    // Remove member mutation
    const removeMember = useMutation({
        mutationFn: (userId: string) =>
            fetch(`/api/team?userId=${userId}`, { method: "DELETE" }).then(r => r.json()),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
    });

    // Update role mutation
    const updateRole = useMutation({
        mutationFn: (data: { userId: string; role: string }) =>
            fetch("/api/team", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
        },
    });

    const roles = [
        {
            value: "OWNER",
            label: "Owner",
            description: "Full access to all features",
            modules: ["All Modules"]
        },
        {
            value: "ADMIN",
            label: "Admin",
            description: "Manage settings, team, and financials",
            modules: ["Dashboard", "Team", "Settings", "Financials", "Stock", "POS"]
        },
        {
            value: "ACCOUNTANT",
            label: "Accountant",
            description: "Financials, Banking, and General Ledger",
            modules: ["Financials", "Ledger", "Bills", "Expenses", "Banking", "Audit"]
        },
        {
            value: "MANAGER",
            label: "Manager",
            description: "Inventory, Sales, and Procurement initiation",
            modules: ["Stock", "POS", "Suppliers", "Invoices", "Dashboard"]
        },
        {
            value: "CASHIER",
            label: "Cashier",
            description: "Point of Sale (POS) and locally managed clients",
            modules: ["POS", "Clients"]
        },
        {
            value: "VIEWER",
            label: "Viewer",
            description: "Read-only access to specific reports",
            modules: ["Dashboard", "Reports"]
        },
    ];

    const getRoleColor = (role: string) => {
        const colors: Record<string, string> = {
            OWNER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            ACCOUNTANT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            CASHIER: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            VIEWER: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
        };
        return colors[role] || colors.VIEWER;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Team Management</h1>
                    <p className="text-muted-foreground">Manage your team members and their roles</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                </button>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{data?.members?.length || 0}</p>
                            <p className="text-sm text-muted-foreground">Team Members</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8 text-orange-500" />
                        <div>
                            <p className="text-2xl font-bold">{data?.pendingInvites?.length || 0}</p>
                            <p className="text-sm text-muted-foreground">Pending Invites</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-green-500" />
                        <div>
                            <p className="text-2xl font-bold">{roles.length}</p>
                            <p className="text-sm text-muted-foreground">Available Roles</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-card rounded-lg border border-border">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold">Team Members</h2>
                </div>
                <div className="divide-y divide-border">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : (data?.members || []).length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No team members yet. Invite someone to get started!
                        </div>
                    ) : (
                        (data?.members || []).map((member: TeamMember) => (
                            <div key={member.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="font-semibold text-primary">
                                            {member.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={member.role}
                                        onChange={(e) => updateRole.mutate({ userId: member.id, role: e.target.value })}
                                        disabled={updateRole.isPending}
                                        className={`px-2 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${getRoleColor(member.role)}`}
                                    >
                                        {roles.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                    <span className="flex items-center gap-1 text-sm text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        Active
                                    </span>
                                    <button
                                        onClick={() => removeMember.mutate(member.id)}
                                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Invite Team Member</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex p-1 bg-muted rounded-lg mb-6">
                            <button
                                onClick={() => setIsDirectAdd(false)}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!isDirectAdd ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Invite via Email
                            </button>
                            <button
                                onClick={() => setIsDirectAdd(true)}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${isDirectAdd ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Create Directly
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {isDirectAdd && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colleague@example.com"
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
                                    />
                                </div>
                            </div>

                            {isDirectAdd && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Initial Password</label>
                                    <input
                                        type="text"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <div className="space-y-2">
                                    {roles.map((role) => (
                                        <label
                                            key={role.value}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${inviteRole === role.value
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                value={role.value}
                                                checked={inviteRole === role.value}
                                                onChange={(e) => setInviteRole(e.target.value)}
                                                className="hidden"
                                            />
                                            <div className={`w-4 h-4 rounded-full border-2 ${inviteRole === role.value ? "border-primary bg-primary" : "border-border"}`} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-sm">{role.label}</p>
                                                    <div className="flex gap-1 flex-wrap justify-end max-w-[150px]">
                                                        {role.modules.slice(0, 2).map(m => (
                                                            <span key={m} className="text-[10px] px-1.5 py-0.5 bg-muted rounded border border-border">
                                                                {m}
                                                            </span>
                                                        ))}
                                                        {role.modules.length > 2 && (
                                                            <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                                                                +{role.modules.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{role.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => sendInvite.mutate({
                                    email: inviteEmail,
                                    role: inviteRole,
                                    name: newName,
                                    password: newPassword,
                                    directAdd: isDirectAdd
                                })}
                                disabled={!inviteEmail || (isDirectAdd && (!newName || !newPassword)) || sendInvite.isPending}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                {sendInvite.isPending ? "Processing..." : isDirectAdd ? "Create Account" : "Send Invite"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
