import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type BusinessRow = {
  id: string;
  name: string;
  created_at: string;
  agency: { id: string; name: string } | null;
};

type BusinessRowRaw = {
  id: string;
  name: string;
  created_at: string;
  agency: { id: string; name: string } | { id: string; name: string }[] | null;
};

export default async function PlatformBusinessesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, created_at, agency:agencies!inner(id, name)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as BusinessRowRaw[];
  const businesses = rows
    .map((business) => ({
      ...business,
      agency: Array.isArray(business.agency) ? business.agency[0] ?? null : business.agency,
    }))
    .filter((business) => business.agency) as BusinessRow[];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Businesses</h1>
          <p className="text-gray-600">Manage agency businesses</p>
        </div>
        <Link
          href="/platform/businesses/new"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Business
        </Link>
      </div>

      <div className="mt-6 rounded-xl border bg-white">
        {businesses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No businesses yet</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Agency</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {businesses.map((business) => (
                <tr key={business.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/platform/businesses/${business.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {business.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-gray-700">{business.agency?.name}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {new Date(business.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
