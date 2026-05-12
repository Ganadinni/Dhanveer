import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <span className="text-3xl">🚫</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-500 mb-6">
          You don&apos;t have permission to view this page. Contact your admin to request access.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
