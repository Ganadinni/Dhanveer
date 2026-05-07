"use client";

import { useState } from "react";
import { FEATURES } from "@/lib/permissions";

type UserRole = "ADMIN" | "SALES" | "VIEWER";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
  _count: { leads: number };
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-purple-50 text-purple-700",
  SALES: "bg-green-50 text-green-700",
  VIEWER: "bg-slate-100 text-slate-600",
};

// Features visible to non-admins (admins always have everything)
const GRANTABLE_FEATURES = FEATURES.filter((f) => f.key !== "manage_leads");

function PermissionsPanel({ user, onUpdate }: { user: UserRecord; onUpdate: (id: string, permissions: string[]) => void }) {
  const [saving, setSaving] = useState(false);

  if (user.role === "ADMIN") {
    return <p className="text-xs text-slate-400 italic">Admin has full access to all features.</p>;
  }

  // SALES always has manage_leads implicitly
  const effectivePermissions = user.role === "SALES"
    ? [...new Set([...user.permissions, "manage_leads"])]
    : user.permissions;

  async function toggle(featureKey: string) {
    setSaving(true);
    const newPerms = effectivePermissions.includes(featureKey)
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
    <div className="space-y-2">
      {/* manage_leads is implicit for SALES — show as locked on */}
      {user.role === "SALES" && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-4 rounded-full bg-green-500 relative flex-shrink-0 opacity-50 cursor-not-allowed">
            <span className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">Manage Leads <span className="text-slate-400 font-normal">(default for Sales)</span></p>
            <p className="text-[11px] text-slate-400">Create and edit leads</p>
          </div>
        </div>
      )}
      {GRANTABLE_FEATURES.map((f) => {
        const enabled = effectivePermissions.includes(f.key);
        return (
          <div key={f.key} className="flex items-center gap-3">
            <button
              disabled={saving}
              onClick={() => toggle(f.key)}
              className={`w-8 h-4 rounded-full relative flex-shrink-0 transition-colors ${enabled ? "bg-green-500" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${enabled ? "right-0.5" : "left-0.5"}`} />
            </button>
            <div>
              <p className="text-xs font-medium text-slate-700">{f.label}</p>
              <p className="text-[11px] text-slate-400">{f.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InviteModal({ onClose, onAdd }: { onClose: () => void; onAdd: (u: UserRecord) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("SALES");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Invite Team Member</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500">Full Name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" required
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ravi@example.com" required
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Initial Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="SALES">Sales Rep — manages leads, no extra features by default</option>
              <option value="ADMIN">Admin — full access to everything</option>
              <option value="VIEWER">Viewer — read-only, no features by default</option>
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

export function UsersClient({ initialUsers, currentUserId }: { initialUsers: UserRecord[]; currentUserId: string }) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleAdd(user: UserRecord) {
    setUsers((prev) => [...prev, { ...user, permissions: user.permissions ?? [] }]);
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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name}? Their leads will remain but become unassigned.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <>
      {showModal && <InviteModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{users.length} team member{users.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Invite Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Leads</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Features</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isExpanded = expandedId === user.id;
              const grantedCount = user.role === "ADMIN" ? FEATURES.length
                : user.role === "SALES" ? [...new Set([...user.permissions, "manage_leads"])].length
                : user.permissions.length;

              return (
                <>
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {user.name}
                      {user.id === currentUserId && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.id === currentUserId ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>{user.role}</span>
                      ) : (
                        <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 ${ROLE_COLORS[user.role]}`}>
                          <option value="SALES">SALES</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user._count.leads}</td>
                    <td className="px-4 py-3">
                      {user.id !== currentUserId ? (
                        <button onClick={() => setExpandedId(isExpanded ? null : user.id)}
                          className="text-xs text-slate-500 hover:text-green-700 flex items-center gap-1">
                          <span>{grantedCount}/{FEATURES.length} enabled</span>
                          <span className="text-slate-300">{isExpanded ? "▲" : "▼"}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">{grantedCount}/{FEATURES.length} enabled</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== currentUserId && (
                        <button onClick={() => handleDelete(user.id, user.name)}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${user.id}-perms`} className="bg-slate-50">
                      <td colSpan={6} className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Feature Access for {user.name}</p>
                        <PermissionsPanel user={user} onUpdate={handlePermissionsUpdate} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
