import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type AgencyDetail = {
  id: string;
  name: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  created_at: string;
};

export default async function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  if (!resolvedParams?.id) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Agency not found</h1>
          <Link
            href="/platform/agencies"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to agencies
          </Link>
        </div>
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          We could not find an agency with this ID.
        </div>
      </div>
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agencies')
    .select('id, name, subscription_status, subscription_tier, created_at')
    .eq('id', resolvedParams.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Agency not found</h1>
          <Link
            href="/platform/agencies"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to agencies
          </Link>
        </div>
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          We could not find an agency with this ID.
        </div>
      </div>
    );
  }

  const agency = data as AgencyDetail;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{agency.name}</h1>
          <p className="text-gray-600">Agency details and status</p>
        </div>
        <Link
          href="/platform/agencies"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to agencies
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Subscription
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Status:</span>{' '}
              {agency.subscription_status ?? 'unknown'}
            </p>
            <p>
              <span className="font-medium text-gray-900">Tier:</span>{' '}
              {agency.subscription_tier ?? '—'}
            </p>
            <p>
              <span className="font-medium text-gray-900">Created:</span>{' '}
              {new Date(agency.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Reviews</h2>
          <p className="text-sm text-gray-500">Review insights will appear here.</p>
        </div>

        <div className="rounded-xl border bg-white p-6 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Locations</h2>
          <p className="text-sm text-gray-500">Location details will appear here.</p>
        </div>
      </div>
    </div>
  );
}
