import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export async function requirePlatformAdmin(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminEmail) {
    throw new Error('PLATFORM_ADMIN_EMAIL is not set.');
  }

  if ((user.email ?? '').toLowerCase() !== adminEmail) {
    redirect('/');
  }

  return user;
}
