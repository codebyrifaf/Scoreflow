import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type ReviewDetail = {
  id: string;
  rating: number | null;
  feedback_text: string | null;
  created_at: string;
  agency: { id: string; name: string } | null;
};

type ReviewDetailRaw = {
  id: string;
  rating: number | null;
  feedback_text: string | null;
  created_at: string;
  agency: { id: string; name: string } | { id: string; name: string }[] | null;
};

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  if (!resolvedParams?.id) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Review not found</h1>
          <Link
            href="/platform/reviews"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to reviews
          </Link>
        </div>
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          We could not find a review with this ID.
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, feedback_text, created_at, agency:agencies!inner(id, name)')
    .eq('id', resolvedParams.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Review not found</h1>
          <Link
            href="/platform/reviews"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Back to reviews
          </Link>
        </div>
        <div className="rounded-xl border bg-white p-6 text-gray-600">
          We could not find a review with this ID.
        </div>
      </div>
    );
  }

  const rawReview = data as ReviewDetailRaw;
  const review: ReviewDetail = {
    ...rawReview,
    agency: Array.isArray(rawReview.agency)
      ? rawReview.agency[0] ?? null
      : rawReview.agency,
  };

  async function deleteReview() {
    'use server';

    const supabaseServer = await createClient();
    const { error: deleteError } = await supabaseServer
      .from('reviews')
      .delete()
      .eq('id', review.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    redirect('/platform/reviews');
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Review Details</h1>
          <p className="text-gray-600">Review for {review.agency?.name}</p>
        </div>
        <Link
          href="/platform/reviews"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Back to reviews
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Review</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Agency:</span>{' '}
              {review.agency?.name}
            </p>
            <p>
              <span className="font-medium text-gray-900">Rating:</span>{' '}
              {review.rating ?? '-'}
            </p>
            <p>
              <span className="font-medium text-gray-900">Created:</span>{' '}
              {new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Comment</h2>
          <p className="text-sm text-gray-600">
            {review.feedback_text?.trim() || 'No comment'}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Future: moderation / flagging system
          </h2>
          <p className="text-sm text-gray-500">
            Review moderation tools will be added here.
          </p>
        </div>

        <form
          action={deleteReview}
          className="flex items-center justify-end lg:col-span-3"
        >
          <button
            type="submit"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            Delete review
          </button>
        </form>
      </div>
    </div>
  );
}
