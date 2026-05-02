import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/require-platform-admin';
import type { ReactNode } from 'react';
import PlatformShell from '@/components/platform/platform-shell';

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requirePlatformAdmin();
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? null;
  const displayEmail = profile?.email ?? user.email ?? 'unknown';

  return (
    <PlatformShell user={{ fullName: displayName, email: displayEmail }}>
      {children}
    </PlatformShell>
  );
}
