'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Stats {
  totalAgencies: number;
  activeAgencies: number;
  totalReviews: number;
  avgRating: number | null;
}

interface AgencyByStatus {
  status: string | null;
  count: number;
}

interface RecentAgency {
  id: string;
  name: string;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  createdAt: Date;
}

interface Props {
  stats: Stats;
  agenciesByStatus: AgencyByStatus[];
  recentAgencies: RecentAgency[];
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  trial: '#f59e0b',
  past_due: '#ef4444',
  canceled: '#6b7280',
  paused: '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trial: 'Trial',
  past_due: 'Past Due',
  canceled: 'Canceled',
  paused: 'Paused',
};

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });
  });
}

export default function PlatformOverviewClient({
  stats,
  agenciesByStatus,
  recentAgencies,
}: Props) {
  const pieData = agenciesByStatus.map((item) => ({
    name: STATUS_LABELS[item.status ?? ''] ?? item.status ?? 'Unknown',
    value: Number(item.count),
    color: STATUS_COLORS[item.status ?? ''] ?? '#6b7280',
  }));

  const barData = getLast7Days().map((day) => ({
    day,
    reviews: 0,
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Agencies"
          value={stats.totalAgencies}
          color="bg-violet-500"
        />
        <StatCard
          label="Total Reviews"
          value={stats.totalReviews}
          color="bg-pink-500"
        />
        <StatCard
          label="Avg Platform Rating"
          value={stats.avgRating ?? '—'}
          color="bg-amber-500"
        />
        <StatCard
          label="Active This Month"
          value={stats.activeAgencies}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Agencies by Status
          </h2>
          {pieData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              No agencies yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Agencies']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Reviews This Week
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="reviews" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-800">
          Recent Agencies
        </h2>
        {recentAgencies.length === 0 ? (
          <p className="text-sm text-gray-400">
            No agencies created yet. Create your first agency to get started.
          </p>
        ) : (
          <ul className="divide-y">
            {recentAgencies.map((agency) => (
              <li key={agency.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{agency.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(agency.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  style={{
                    background: `${STATUS_COLORS[agency.subscriptionStatus ?? ''] ?? '#6b7280'}20`,
                    color: STATUS_COLORS[agency.subscriptionStatus ?? ''] ?? '#6b7280',
                  }}
                >
                  {STATUS_LABELS[agency.subscriptionStatus ?? ''] ??
                    agency.subscriptionStatus}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-5">
      <div className={`h-10 w-10 rounded-lg ${color} flex-shrink-0`} />
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
