import { db } from "@/lib/db";

export const FEATURES = [
  { key: "dashboard_view",     label: "Dashboard",            description: "View dashboard, reports and KPIs" },
  { key: "products_view",      label: "Products View",        description: "View product catalogue and knowledge base" },
  { key: "products_edit",      label: "Products Edit",        description: "Create and edit products" },
  { key: "shopify_sync",       label: "Shopify Sync",         description: "Sync products with Shopify" },
  { key: "content_generation", label: "Content Generation",   description: "Generate AI marketing content" },
  { key: "design_generation",  label: "Design Generation",    description: "Generate design assets using AI" },
  { key: "campaign_creation",  label: "Campaign Creation",    description: "Create and manage campaigns" },
  { key: "asset_library",      label: "Asset Library",        description: "Access and manage brand assets" },
  { key: "pricing_access",     label: "Pricing Access",       description: "View product pricing and margins" },
  { key: "costing_access",     label: "Costing Access",       description: "View and manage cost sheets" },
  { key: "dhanveer_access",    label: "Dhanveer (Sales CRM)", description: "Access leads, pipeline, tasks and sales tools" },
  { key: "rachana_access",     label: "Rachana",              description: "Access Rachana inventory system" },
  { key: "rasik_access",       label: "Rasik",                description: "Access Rasik integration and events" },
  { key: "approvals",          label: "Approvals",            description: "Approve campaigns, designs and content" },
  { key: "publish_website",    label: "Publish to Website",   description: "Publish content to the website" },
  { key: "push_shopify",       label: "Push to Shopify",      description: "Push products and content to Shopify" },
  { key: "user_management",    label: "User Management",      description: "Invite, approve and manage team members" },
  { key: "settings",           label: "Settings",             description: "Manage integrations and app settings" },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];

export const ALL_FEATURE_KEYS = FEATURES.map((f) => f.key) as FeatureKey[];

// Default permissions per role (used when computing effective permissions)
export const ROLE_DEFAULT_PERMISSIONS: Record<string, FeatureKey[]> = {
  SUPER_ADMIN: ALL_FEATURE_KEYS,
  ADMIN:       ALL_FEATURE_KEYS,
  MANAGER:     ["dashboard_view", "dhanveer_access", "approvals", "products_view", "rasik_access"],
  CREATIVE:    ["dashboard_view", "content_generation", "design_generation", "campaign_creation", "asset_library"],
  PRODUCT:     ["dashboard_view", "products_view", "products_edit", "shopify_sync", "pricing_access", "costing_access", "push_shopify"],
  SALES:       ["dashboard_view", "dhanveer_access"],
  VIEWER:      ["dashboard_view"],
};

// Returns effective permissions for a user (role defaults merged with custom grants)
export function getEffectivePermissions(role: string, customPermissions: string[]): FeatureKey[] {
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[role] ?? [];
  const merged = new Set([...roleDefaults, ...customPermissions]);
  return [...merged] as FeatureKey[];
}

export function hasPermission(effectivePermissions: string[], feature: FeatureKey): boolean {
  return effectivePermissions.includes(feature);
}

export async function userHasPermission(userId: string, role: string, feature: FeatureKey): Promise<boolean> {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[role] ?? [];
  if (roleDefaults.includes(feature)) return true;
  const user = await db.user.findUnique({ where: { id: userId }, select: { permissions: true } });
  return user?.permissions.includes(feature) ?? false;
}

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number]);
}
