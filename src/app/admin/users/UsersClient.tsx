"use client";

import { useState } from "react";
import { FEATURES, ROLE_DEFAULT_PERMISSIONS, getEffectivePermissions } from "@/lib/permissions";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "CREATIVE" | "PRODUCT" | "SALES" | "VIEWER";
type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  lastLogin: string | null;
  approvedBy: string | null;
  invitedBy: string | null;
  createdAt: string;
  _count: { leads: number };
}

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-amber-50 text-amber-700",
  ADMIN:       "bg-purple-50 text-purple-700",
  MANAGER:     "bg-blue-50 text-blue-700",
  CREATIVE:    "bg-pink-50 text-pink-700",
  PRODUCT:     "bg-indigo-50 text-indigo-700",
  SALES:       "bg-green-50 text-green-700",
  VIEWER:      "bg-slate-100 text-slate-600",
};

const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE:    "bg-green-50 text-green-700",
  PENDING:   "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-red-50 text-red-600",
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin — full access + user management" },
  { value: "ADMIN",       label: "Admin — full access to all features" },
  { value: "MANAGER",     label: "Manager — sales oversight + approvals" },
  { value: "CREATIVE",    label: "Creative Team — content & design tools" },
  { value: "PRODUCT",     label: "Product Team — product & pricing tools" },
  { value: "SALES",       label: "Sales Team — leads & pipeline" },
  { value: "VIEWER",      label: "Viewer — read-only dashboard access" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

// ── Permissions Panel ─────────────────────────────────────────────────────────

function PermissionsPanel({
  user,
  isSuperAdmin,
  onUpdate,
}: {
  user: UserRecord;
  isSuperAdmin: boolean;
  onUpdate: (id: string, permissions: string[]) => void;
}) {
  const [saving, setSaving] = useState(false);

  if (["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return <p className="text-xs text-slate-400 italic">This role has full access to all features.</p>;
  }

  const roleDefaults = new Set(ROLE_DEFAULT_PERMISSIONS[user.role] ?? []);
  const effectivePerms = new Set(getEffectivePermissions(user.role, user.permissions));

  async function toggle(featureKey: string) {
    if (roleDefaults.has(featureKey as never)) return; // can't remove role defaults
    setSaving(true);
    const newPerms = effectivePerms.has(featureKey as never)
      ? user.permissions.filter((p) => p !== featureKey)
      : [...user.permissions, featureKey];
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: newPerms }),
    });
    onUpdate(user.id, newPerms);
    setSaving(false);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {FEATURES.map((f) => {
        const isDefault = roleDefaults.has(f.key);
        const enabled = effectivePerms.has(f.key);
        return (
          <div key={f.key} className="flex items-start gap-2.5">
            <button
              disabled={saving || isDefault || !isSuperAdmin && user.role === "SUPER_ADMIN"}
              onClick={() => toggle(f.key)}
              title={isDefault ? "Included by default for this role" : undefined}
              className={`mt-0.5 w-8 h-4 rounded-full relative flex-shrink-0 transition-colors ${
                enabled ? "bg-green-500" : "bg-slate-200"
              } ${isDefault ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${enabled ? "right-0.5" : "left-0.5"}`} />
            </button>
            <div>
              <p className="text-xs font-medium text-slate-700 leading-tight">
                {f.label}
                {isDefault && <span className="ml-1 text-[10px] text-slate-400">(role default)</span>}
              </p>
              <p className="text-[10px] text-slate-400">{f.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({
  currentRole,
  onClose,
  onAdd,
}: {
  currentRole: string;
  onClose: () => void;
  onAdd: (u: UserRecord) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("SALES");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const availableRoles = currentRole === "SUPER_ADMIN"
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => r.value !== "SUPER_ADMIN");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.endsWith("@theteaplanet.com")) {
      setError("Only @theteaplanet.com email addresses are allowed.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create user");
    } else {
      onAdd(data.user);
      onClose();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Add Team Member</h2>
        <p className="text-xs text-slate-400 mb-4">Only @theteaplanet.com addresses can be added.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Full Name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" required
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ravi@theteaplanet.com" required
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Initial Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              {saving ? "Creating…" : "Create Account"}
            </button>
            <button type="button" onClick={onClose} className="px-4 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────────

function UserRow({
  user,
  isCurrentUser,
  currentRole,
  expanded,
  onToggleExpand,
  onRoleChange,
  onPermissionsUpdate,
  onApprove,
  onReject,
  onSuspend,
  onDelete,
}: {
  user: UserRecord;
  isCurrentUser: boolean;
  currentRole: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onRoleChange: (id: string, role: UserRole) => void;
  onPermissionsUpdate: (id: string, permissions: string[]) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, name: string) => void;
  onSuspend: (id: string, suspend: boolean) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const canEdit = !isCurrentUser && (isSuperAdmin || user.role !== "SUPER_ADMIN");
  const effectiveCount = getEffectivePermissions(user.role, user.permissions).length;

  const availableRoles = isSuperAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => r.value !== "SUPER_ADMIN");

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-4 py-3">
          <p className="font-medium text-slate-900 text-sm">
            {user.name}
            {isCurrentUser && <span className="ml-1.5 text-xs text-slate-400">(you)</span>}
          </p>
          <p className="text-xs text-slate-400">{user.email}</p>
        </td>
        <td className="px-4 py-3">
          {canEdit ? (
            <select
              value={user.role}
              onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
              className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 ${ROLE_COLORS[user.role]}`}
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>{r.value}</option>
              ))}
            </select>
          ) : (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>{user.role}</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[user.status]}`}>{user.status}</span>
        </td>
        <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{formatDate(user.lastLogin)}</td>
        <td className="px-4 py-3">
          {canEdit ? (
            <button onClick={onToggleExpand}
              className="text-xs text-slate-500 hover:text-green-700 flex items-center gap-1">
              <span>{effectiveCount}/{FEATURES.length}</span>
              <span className="text-slate-300">{expanded ? "▲" : "▼"}</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400">{effectiveCount}/{FEATURES.length}</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {user.status === "PENDING" && canEdit && (
              <>
                <button onClick={() => onApprove(user.id)}
                  className="text-xs font-medium text-green-600 hover:text-green-800 border border-green-200 hover:border-green-400 px-2 py-0.5 rounded transition-colors">
                  Approve
                </button>
                <button onClick={() => onReject(user.id, user.name)}
                  className="text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-0.5 rounded transition-colors">
                  Reject
                </button>
              </>
            )}
            {user.status === "ACTIVE" && canEdit && (
              <button onClick={() => onSuspend(user.id, true)}
                className="text-xs text-slate-400 hover:text-amber-600 transition-colors">
                Suspend
              </button>
            )}
            {user.status === "SUSPENDED" && canEdit && (
              <button onClick={() => onSuspend(user.id, false)}
                className="text-xs text-slate-400 hover:text-green-600 transition-colors">
                Unsuspend
              </button>
            )}
            {canEdit && user.status !== "PENDING" && (
              <button onClick={() => onDelete(user.id, user.name)}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                Remove
              </button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50 border-t border-slate-100">
          <td colSpan={6} className="px-6 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Feature Access — {user.name}</p>
            <PermissionsPanel user={user} isSuperAdmin={isSuperAdmin} onUpdate={onPermissionsUpdate} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Client ───────────────────────────────────────────────────────────────

export function UsersClient({
  initialUsers,
  currentUserId,
  currentUserRole,
  pendingCount,
}: {
  initialUsers: UserRecord[];
  currentUserId: string;
  currentUserRole: string;
  pendingCount: number;
}) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [tab, setTab] = useState<"all" | "pending">(pendingCount > 0 ? "pending" : "all");
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeUsers  = users.filter((u) => u.status !== "PENDING");
  const pendingUsers = users.filter((u) => u.status === "PENDING");
  const displayUsers = tab === "pending" ? pendingUsers : activeUsers;

  function handleAdd(user: UserRecord) {
    setUsers((prev) => [...prev, user]);
  }

  async function handleRoleChange(id: string, newRole: UserRole) {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: newRole } : u));
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
  }

  function handlePermissionsUpdate(id: string, permissions: string[]) {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, permissions } : u));
  }

  async function handleApprove(id: string) {
    const res = await fetch(`/api/admin/users/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: "ACTIVE" } : u));
      if (pendingUsers.length === 1) setTab("all");
    }
  }

  async function handleReject(id: string, name: string) {
    if (!confirm(`Reject and remove ${name}'s account request?`)) return;
    const res = await fetch(`/api/admin/users/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (pendingUsers.length === 1) setTab("all");
    }
  }

  async function handleSuspend(id: string, suspend: boolean) {
    if (suspend && !confirm(`Suspend this user? They will not be able to log in.`)) return;
    const res = await fetch(`/api/admin/users/${id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspend }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: suspend ? "SUSPENDED" : "ACTIVE" } : u));
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name}? Their leads will remain but become unassigned.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  const currentPending = users.filter((u) => u.status === "PENDING").length;

  return (
    <>
      {showModal && (
        <InviteModal
          currentRole={currentUserRole}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setTab("all")}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${tab === "all" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            All Members ({activeUsers.length})
          </button>
          <button
            onClick={() => setTab("pending")}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${tab === "pending" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            Pending Approval
            {currentPending > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {currentPending}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Member
        </button>
      </div>

      {/* Pending notice */}
      {tab === "pending" && currentPending === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-400">No pending approval requests.</p>
        </div>
      )}

      {/* Users table */}
      {(tab === "all" || currentPending > 0) && displayUsers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-xs text-slate-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-slate-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-slate-500 hidden md:table-cell">Last Login</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-slate-500">Permissions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isCurrentUser={user.id === currentUserId}
                  currentRole={currentUserRole}
                  expanded={expandedId === user.id}
                  onToggleExpand={() => setExpandedId(expandedId === user.id ? null : user.id)}
                  onRoleChange={handleRoleChange}
                  onPermissionsUpdate={handlePermissionsUpdate}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSuspend={handleSuspend}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role legend */}
      <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Role Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ROLE_OPTIONS.map((r) => (
            <div key={r.value} className="flex items-center gap-2">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ROLE_COLORS[r.value]}`}>{r.value}</span>
              <span className="text-xs text-slate-500">{r.label.split(" — ")[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
