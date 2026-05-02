import { createClient } from '@/lib/supabase/server';
import PlatformOverviewClient from '@/components/platform/overview/platform-overview-client';

type PlatformOverviewData = {
  stats?: {
    total_agencies: number | null;
    active_agencies: number | null;
    total_reviews: number | null;
    avg_rating: number | null;
  } | null;
  agencies_by_status?: { status: string | null; count: number }[] | null;
  recent_agencies?: {
    id: string;
    name: string;
    subscription_status: string | null;
    subscription_tier: string | null;
    created_at: string;
  }[] | null;
};

type PlatformOverviewStats = {
  totalAgencies: number;
  activeAgencies: number;
  totalReviews: number;
  avgRating: number | null;
};

type RecentAgencyRow = NonNullable<PlatformOverviewData['recent_agencies']>[number];

export default async function PlatformOverviewPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_platform_overview_data');

  if (error) {
    throw new Error(error.message);
  }

  const overviewData = data as PlatformOverviewData | null;
  const stats = overviewData?.stats;
  const agenciesByStatus = overviewData?.agencies_by_status ?? [];
  const recentAgenciesRaw = (overviewData?.recent_agencies ?? []) as RecentAgencyRow[];

  const normalizedStats: PlatformOverviewStats = {
    totalAgencies: stats?.total_agencies ?? 0,
    activeAgencies: stats?.active_agencies ?? 0,
    totalReviews: stats?.total_reviews ?? 0,
    avgRating: stats?.avg_rating ?? null,
  };

  const recentAgencies = recentAgenciesRaw.map((agency) => ({
    id: agency.id,
    name: agency.name,
    subscriptionStatus: agency.subscription_status,
    subscriptionTier: agency.subscription_tier,
    createdAt: new Date(agency.created_at),
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Platform Overview</h1>
      <p className="text-gray-500 mb-8">Monitor all agencies and system performance</p>
      <PlatformOverviewClient
        stats={normalizedStats}
        agenciesByStatus={agenciesByStatus}
        recentAgencies={recentAgencies}
      />
    </div>
  );
}
