import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
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