import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type LocationRow = {
  id: string;
  name: string;
  created_at: string;
  business: { id: string; name: string } | null;
  agency: { id: string; name: string } | null;
};

type LocationRowRaw = {
  id: string;
  name: string;
  created_at: string;
  business:
    | {
        id: string;
        name: string;
        agency: { id: string; name: string } | { id: string; name: string }[] | null;
      }
    | {
        id: string;
        name: string;
        agency: { id: string; name: string } | { id: string; name: string }[] | null;
      }[]
    | null;
};

export default async function PlatformLocationsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, created_at, business:businesses!inner(id, name, agency:agencies!inner(id, name))')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as LocationRowRaw[];
  const locations = rows
    .map((location) => {
      const business = Array.isArray(location.business)
        ? location.business[0] ?? null
        : location.business;
      const agency = business
        ? Array.isArray(business.agency)
          ? business.agency[0] ?? null
          : business.agency
        : null;

      return {
        id: location.id,
        name: location.name,
        created_at: location.created_at,
        business,
        agency,
      } as LocationRow;
    })
    .filter((location) => location.business && location.agency);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Locations</h1>
          <p className="text-gray-600">Manage business locations</p>
        </div>
        <Link
          href="/platform/locations/new"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Location
        </Link>
      </div>

      <div className="mt-6 rounded-xl border bg-white">
        {locations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No locations yet</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Agency</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/platform/locations/${location.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {location.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-gray-700">{location.business?.name}</td>
                  <td className="px-5 py-4 text-gray-700">{location.agency?.name}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {new Date(location.created_at).toLocaleDateString('en-US', {
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
