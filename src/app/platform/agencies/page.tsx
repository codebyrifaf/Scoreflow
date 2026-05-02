import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type AgencyRow = {
  id: string;
  name: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  created_at: string;
};

type SearchParams = {
  status?: string | string[];
  tier?: string | string[];
};

function normalizeParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function PlatformAgenciesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const resolvedSearchParams = (await searchParams) ?? {};
  const statusFilter = normalizeParam(resolvedSearchParams.status) ?? 'all';
  const tierFilter = normalizeParam(resolvedSearchParams.tier) ?? 'all';

  let query = supabase
    .from('agencies')
    .select('id, name, subscription_status, subscription_tier, created_at')
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('subscription_status', statusFilter);
  }

  if (tierFilter !== 'all') {
    query = query.eq('subscription_tier', tierFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const agencies = (data ?? []) as AgencyRow[];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Agencies</h1>
          <p className="text-gray-600">Manage agency accounts and access</p>
        </div>
        <Link
          href="/platform/agencies/new"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Agency
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-3" method="get">
        <select
          name="status"
          defaultValue={statusFilter}
          className="h-10 rounded-lg border bg-white px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
          <option value="paused">Paused</option>
        </select>
        <select
          name="tier"
          defaultValue={tierFilter}
          className="h-10 rounded-lg border bg-white px-3 text-sm"
        >
          <option value="all">All tiers</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg border bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Apply
        </button>
      </form>

      <div className="mt-6 rounded-xl border bg-white">
        {agencies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No agencies found</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/platform/agencies/${agency.id}`}
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      {agency.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
                      {agency.subscription_status ?? 'unknown'}
                    </span>
                  </td>
                  <td className="px-5 py-4 capitalize text-gray-700">
                    {agency.subscription_tier ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {new Date(agency.created_at).toLocaleDateString('en-US', {
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
