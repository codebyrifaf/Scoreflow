import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReviewForm from '@/components/platform/reviews/review-form';

type AgencyOption = {
  id: string;
  name: string;
};

type BusinessOption = {
  id: string;
  name: string;
  agency_id: string | null;
};

type LocationOption = {
  id: string;
  name: string;
  business_id: string | null;
  agency_id: string | null;
};

export default async function NewReviewPage() {
  const supabase = await createClient();
  const [agenciesResult, businessesResult, locationsResult] = await Promise.all([
    supabase.from('agencies').select('id, name').order('name'),
    supabase.from('businesses').select('id, name, agency_id').order('name'),
    supabase.from('locations').select('id, name, business_id, agency_id').order('name'),
  ]);

  if (agenciesResult.error) {
    throw new Error(agenciesResult.error.message);
  }

  if (businessesResult.error) {
    throw new Error(businessesResult.error.message);
  }

  if (locationsResult.error) {
    throw new Error(locationsResult.error.message);
  }

  const agencies = (agenciesResult.data ?? []) as AgencyOption[];
  const businesses = (businessesResult.data ?? []) as BusinessOption[];
  const locations = (locationsResult.data ?? []) as LocationOption[];

  async function createReview(formData: FormData) {
    'use server';

    const supabaseServer = await createClient();
    const agencyId = String(formData.get('agency_id') ?? '').trim();
    const businessId = String(formData.get('business_id') ?? '').trim();
    const locationId = String(formData.get('location_id') ?? '').trim();
    const ratingValue = Number(formData.get('rating'));
    const commentValue = String(formData.get('comment') ?? '').trim();

    if (!agencyId) {
      throw new Error('Agency is required.');
    }

    if (!businessId) {
      throw new Error('Business is required.');
    }

    if (!locationId) {
      throw new Error('Location is required.');
    }

    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      throw new Error('Rating must be an integer between 1 and 5.');
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

    const { data: business, error: businessError } = await supabaseServer
      .from('businesses')
      .select('id, agency_id')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError) {
      throw new Error(businessError.message);
    }

    if (!business || business.agency_id !== agencyId) {
      throw new Error('Invalid business selection.');
    }

    const { data: location, error: locationError } = await supabaseServer
      .from('locations')
      .select('id, agency_id, business_id')
      .eq('id', locationId)
      .maybeSingle();

    if (locationError) {
      throw new Error(locationError.message);
    }

    if (!location || location.agency_id !== agencyId || location.business_id !== businessId) {
      throw new Error('Invalid location selection.');
    }

    const sentiment = ratingValue >= 4 ? 'positive' : ratingValue === 3 ? 'neutral' : 'negative';

    const { error: insertError } = await supabaseServer.from('reviews').insert({
      agency_id: agencyId,
      business_id: businessId,
      location_id: locationId,
      rating: ratingValue,
      sentiment,
      feedback_text: commentValue.length ? commentValue : null,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    redirect('/platform/reviews');
  }

  const businessOptions = businesses
    .filter((business) => business.agency_id)
    .map((business) => ({
      id: business.id,
      name: business.name,
      agencyId: business.agency_id as string,
    }));

  const locationOptions = locations
    .filter((location) => location.agency_id && location.business_id)
    .map((location) => ({
      id: location.id,
      name: location.name,
      agencyId: location.agency_id as string,
      businessId: location.business_id as string,
    }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Create Review</h1>
          <p className="text-gray-600">Add a new review entry</p>
        </div>
        <Link
          href="/platform/reviews"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to reviews
        </Link>
      </div>

      {agencies.length === 0 || businessOptions.length === 0 || locationOptions.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          Agencies, businesses, and locations are required before adding reviews.
        </div>
      ) : (
        <ReviewForm
          agencies={agencies}
          businesses={businessOptions}
          locations={locationOptions}
          action={createReview}
        />
      )}
    </div>
  );
}
