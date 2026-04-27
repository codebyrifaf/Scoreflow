import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ReactNode } from 'react';
import PlatformShell from '@/components/platform/platform-shell';

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/platform/overview');
  }

  const [profile] = await db
    .select({ role: users.role, fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!profile || profile.role !== 'platform_admin') {
    redirect('/dashboard');
  }

  return <PlatformShell user={profile}>{children}</PlatformShell>;
}
