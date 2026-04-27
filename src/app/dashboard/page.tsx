import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Note: proxy.ts already redirects unauthenticated users to /login.
  // This is a defense-in-depth check; if proxy somehow fails, we still don't leak.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Dashboard (placeholder)</h1>
        <p className="text-gray-600 mb-2">
          Logged in as: <strong>{user.email}</strong>
        </p>
        <p className="text-gray-600 mb-6">User ID: {user.id}</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}