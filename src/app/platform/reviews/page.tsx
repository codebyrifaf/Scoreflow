import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

type ReviewRow = {
  id: string;
  rating: number | null;
  feedback_text: string | null;
  created_at: string;
  agency: { id: string; name: string } | null;
};

type ReviewRowRaw = {
  id: string;
  rating: number | null;
  feedback_text: string | null;
  created_at: string;
  agency: { id: string; name: string } | { id: string; name: string }[] | null;
};

type RatingBucket = {
  rating: number;
  count: number;
};

export default async function PlatformReviewsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, feedback_text, created_at, agency:agencies!inner(id, name)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ReviewRowRaw[];
  const reviews = rows
    .map((review) => ({
      ...review,
      agency: Array.isArray(review.agency) ? review.agency[0] ?? null : review.agency,
    }))
    .filter((review) => review.agency) as ReviewRow[];

  const ratingDistribution = reviews.reduce<RatingBucket[]>((acc, review) => {
    const rating = Number(review.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return acc;
    }
    const bucket = acc.find((item) => item.rating === rating);
    if (bucket) {
      bucket.count += 1;
    } else {
      acc.push({ rating, count: 1 });
    }
    return acc;
  }, []);

  const distribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: ratingDistribution.find((item) => item.rating === rating)?.count ?? 0,
  }));

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Reviews</h1>
          <p className="text-gray-600">Manage customer reviews across agencies</p>
        </div>
        <Link
          href="/platform/reviews/new"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Review
        </Link>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Rating Distribution</h2>
        <div className="grid grid-cols-5 gap-3">
          {distribution.map((bucket) => (
            <div
              key={bucket.rating}
              className="rounded-lg border bg-gray-50 px-3 py-2 text-center"
            >
              <p className="text-xs text-gray-500">{bucket.rating} star</p>
              <p className="text-lg font-semibold text-gray-900">{bucket.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No reviews yet</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Agency</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Comment</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reviews.map((review) => {
                const comment = review.feedback_text?.trim() || 'No comment';
                const preview = comment.length > 80 ? `${comment.slice(0, 80)}...` : comment;

                return (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <Link
                        href={`/platform/reviews/${review.id}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {review.agency?.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{review.rating ?? '-'}</td>
                    <td className="px-5 py-4 text-gray-600">{preview}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
