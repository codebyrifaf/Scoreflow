import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type BusinessOption = {
  id: string;
  name: string;
  agency_id: string | null;
  agency: { id: string; name: string } | null;
};

type BusinessOptionRaw = {
  id: string;
  name: string;
  agency_id: string | null;
  agency: { id: string; name: string } | { id: string; name: string }[] | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default async function NewLocationPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, agency_id, agency:agencies!inner(id, name)')
    .order('name');

  if (error) {
    throw new Error(error.message);
  }

  const rawBusinesses = (data ?? []) as BusinessOptionRaw[];
  const businesses = rawBusinesses
    .map((business) => ({
      ...business,
      agency: Array.isArray(business.agency) ? business.agency[0] ?? null : business.agency,
    }))
    .filter((business) => business.agency) as BusinessOption[];

  async function createLocation(formData: FormData) {
    'use server';

    const supabaseServer = await createClient();
    const name = String(formData.get('name') ?? '').trim();
    const businessId = String(formData.get('business_id') ?? '').trim();

    if (!name) {
      throw new Error('Location name is required.');
    }

    if (!businessId) {
      throw new Error('Business is required.');
    }

    const { data: business, error: businessError } = await supabaseServer
      .from('businesses')
      .select('id, agency_id')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError) {
      throw new Error(businessError.message);
    }

    if (!business || !business.agency_id) {
      throw new Error('Invalid business selection.');
    }

    const baseSlug = slugify(name) || `location-${Date.now()}`;
    let slug = baseSlug;

    const { data: existingSlug, error: slugError } = await supabaseServer
      .from('locations')
      .select('id')
      .eq('slug', baseSlug)
      .maybeSingle();

    if (slugError) {
      throw new Error(slugError.message);
    }

    if (existingSlug) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const { error: insertError } = await supabaseServer.from('locations').insert({
      name,
      slug,
      business_id: businessId,
      agency_id: business.agency_id,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    redirect('/platform/locations');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Create Location</h1>
          <p className="text-gray-600">Add a new business location</p>
        </div>
        <Link
          href="/platform/locations"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to locations
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          No businesses available. Create a business first.
        </div>
      ) : (
        <form action={createLocation} className="space-y-6 rounded-xl border bg-white p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="name">
              Location name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="h-11 w-full rounded-lg border px-3 text-sm"
              placeholder="Downtown Branch"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="business_id"
            >
              Business
            </label>
            <select
              id="business_id"
              name="business_id"
              className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
              required
            >
              <option value="">Select a business</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name} - {business.agency?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/platform/locations"
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create location
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
