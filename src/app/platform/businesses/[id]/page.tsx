import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type BusinessDetail = {
  id: string;
  name: string;
  created_at: string;
  agency: { id: string; name: string } | null;
};

type BusinessDetailRaw = {
  id: string;
  name: string;
  created_at: string;
  agency: { id: string; name: string } | { id: string; name: string }[] | null;
};

type LocationRow = {
  id: string;
  name: string;
  created_at: string;
};

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  if (!resolvedParams?.id) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Business not found</h1>
          <Link
            href="/platform/businesses"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to businesses
          </Link>
        </div>
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          We could not find a business with this ID.
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, created_at, agency:agencies!inner(id, name)')
    .eq('id', resolvedParams.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Business not found</h1>
          <Link
            href="/platform/businesses"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to businesses
          </Link>
        </div>
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          We could not find a business with this ID.
        </div>
      </div>
    );
  }

  const rawBusiness = data as BusinessDetailRaw;
  const business: BusinessDetail = {
    ...rawBusiness,
    agency: Array.isArray(rawBusiness.agency)
      ? rawBusiness.agency[0] ?? null
      : rawBusiness.agency,
  };

  const { data: locationsData, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  if (locationsError) {
    throw new Error(locationsError.message);
  }

  const locations = (locationsData ?? []) as LocationRow[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{business.name}</h1>
          <p className="text-gray-600">Business details</p>
        </div>
        <Link
          href="/platform/businesses"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to businesses
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Overview</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Agency:</span>{' '}
              {business.agency?.name}
            </p>
            <p>
              <span className="font-medium text-gray-900">Created:</span>{' '}
              {new Date(business.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Locations</h2>
          {locations.length === 0 ? (
            <p className="text-sm text-gray-500">No locations yet.</p>
          ) : (
            <ul className="divide-y">
              {locations.map((location) => (
                <li key={location.id} className="py-3">
                  <Link
                    href={`/platform/locations/${location.id}`}
                    className="text-sm font-medium text-indigo-700 hover:underline"
                  >
                    {location.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {new Date(location.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
