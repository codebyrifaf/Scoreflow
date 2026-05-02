import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function NewAgencyPage() {
  async function createAgency(formData: FormData) {
    'use server';

    const supabase = await createClient();
    const name = String(formData.get('name') ?? '').trim();
    const subscriptionStatus = String(formData.get('subscription_status') ?? 'trial');
    const subscriptionTier = String(formData.get('subscription_tier') ?? 'basic');

    if (!name) {
      throw new Error('Agency name is required.');
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    const contactEmail = user?.email ?? null;

    if (!contactEmail) {
      throw new Error('Contact email is required.');
    }

    const baseSlug = slugify(name) || `agency-${Date.now()}`;

    const { error } = await supabase.from('agencies').insert({
      name,
      slug: baseSlug,
      contact_email: contactEmail,
      subscription_status: subscriptionStatus,
      subscription_tier: subscriptionTier,
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect('/platform/agencies');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Create Agency</h1>
          <p className="text-gray-600">Add a new agency account</p>
        </div>
        <Link
          href="/platform/agencies"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to agencies
        </Link>
      </div>

      <form action={createAgency} className="space-y-6 rounded-xl border bg-white p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="name">
            Agency name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="h-11 w-full rounded-lg border px-3 text-sm"
            placeholder="Acme Agency"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="subscription_status"
            >
              Subscription status
            </label>
            <select
              id="subscription_status"
              name="subscription_status"
              defaultValue="trial"
              className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
            >
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="subscription_tier"
            >
              Subscription tier
            </label>
            <select
              id="subscription_tier"
              name="subscription_tier"
              defaultValue="basic"
              className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
            >
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/platform/agencies"
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create agency
          </button>
        </div>
      </form>
    </div>
  );
}
