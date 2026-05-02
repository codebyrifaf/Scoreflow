import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type AgencyOption = {
  id: string;
  name: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default async function NewBusinessPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agencies')
    .select('id, name')
    .order('name');

  if (error) {
    throw new Error(error.message);
  }

  const agencies = (data ?? []) as AgencyOption[];

  async function createBusiness(formData: FormData) {
    'use server';

    const supabaseServer = await createClient();
    const name = String(formData.get('name') ?? '').trim();
    const agencyId = String(formData.get('agency_id') ?? '').trim();

    if (!name) {
      throw new Error('Business name is required.');
    }

    if (!agencyId) {
      throw new Error('Agency is required.');
    }

    const { data: agency, error: agencyError } = await supabaseServer
      .from('agencies')
      .select('id')
      .eq('id', agencyId)
      .maybeSingle();

    if (agencyError) {
      throw new Error(agencyError.message);
    }

    if (!agency) {
      throw new Error('Invalid agency selection.');
    }

    const baseSlug = slugify(name) || `business-${Date.now()}`;
    let slug = baseSlug;

    const { data: existingSlug, error: slugError } = await supabaseServer
      .from('businesses')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('slug', baseSlug)
      .maybeSingle();

    if (slugError) {
      throw new Error(slugError.message);
    }

    if (existingSlug) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const { error: insertError } = await supabaseServer.from('businesses').insert({
      name,
      agency_id: agencyId,
      slug,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    redirect('/platform/businesses');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Create Business</h1>
          <p className="text-gray-600">Add a new business to an agency</p>
        </div>
        <Link
          href="/platform/businesses"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to businesses
        </Link>
      </div>

      {agencies.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          No agencies available. Create an agency first.
        </div>
      ) : (
        <form action={createBusiness} className="space-y-6 rounded-xl border bg-white p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="name">
              Business name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="h-11 w-full rounded-lg border px-3 text-sm"
              placeholder="Nobu Restaurant Group"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="agency_id"
            >
              Agency
            </label>
            <select
              id="agency_id"
              name="agency_id"
              className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
              required
            >
              <option value="">Select an agency</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/platform/businesses"
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create business
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
