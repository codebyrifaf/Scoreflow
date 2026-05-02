import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type LocationDetail = {
  id: string;
  name: string;
  created_at: string;
  business: { id: string; name: string } | null;
  agency: { id: string; name: string } | null;
};

type LocationDetailRaw = {
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

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  if (!resolvedParams?.id) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Location not found</h1>
          <Link
            href="/platform/locations"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to locations
          </Link>
        </div>
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          We could not find a location with this ID.
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, created_at, business:businesses!inner(id, name, agency:agencies!inner(id, name))')
    .eq('id', resolvedParams.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Location not found</h1>
          <Link
            href="/platform/locations"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to locations
          </Link>
        </div>
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          We could not find a location with this ID.
        </div>
      </div>
    );
  }

  const rawLocation = data as LocationDetailRaw;
  const business = Array.isArray(rawLocation.business)
    ? rawLocation.business[0] ?? null
    : rawLocation.business;
  const agency = business
    ? Array.isArray(business.agency)
      ? business.agency[0] ?? null
      : business.agency
    : null;

  const location: LocationDetail = {
    id: rawLocation.id,
    name: rawLocation.name,
    created_at: rawLocation.created_at,
    business,
    agency,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{location.name}</h1>
          <p className="text-gray-600">Location details</p>
        </div>
        <Link
          href="/platform/locations"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to locations
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium text-gray-900">Business:</span>{' '}
            {location.business?.name}
          </p>
          <p>
            <span className="font-medium text-gray-900">Agency:</span> {location.agency?.name}
          </p>
          <p>
            <span className="font-medium text-gray-900">Created:</span>{' '}
            {new Date(location.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
