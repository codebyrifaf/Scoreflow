'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface PlatformShellProps {
  user: { fullName: string | null; email: string };
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: '/platform/overview', label: 'Overview', icon: '📊' },
  { href: '/platform/agencies', label: 'Agencies', icon: '🏢' },
  { href: '/platform/analytics', label: 'Platform Analytics', icon: '📈' },
  { href: '/platform/system', label: 'System Status', icon: '⚙️' },
];

export default function PlatformShell({ user, children }: PlatformShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-xs font-bold">
              SF
            </span>
            <span className="text-lg font-bold tracking-tight">ScoreFlow Dev</span>
            <span className="rounded bg-white/20 px-2 py-1 text-xs">Platform Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-indigo-50">{user.fullName ?? user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded bg-red-500 px-3 py-1.5 text-sm text-white transition hover:bg-red-600"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="w-60 border-r bg-white py-6">
          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-indigo-50 font-medium text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
