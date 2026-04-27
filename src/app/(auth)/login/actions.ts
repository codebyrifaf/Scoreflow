'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  redirectTo: z.string().optional(),
});

export async function signInWithPassword(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: formData.get('redirectTo'),
  });

  if (!parsed.success) {
    return { error: 'Invalid credentials format' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  const dest = parsed.data.redirectTo;
  const safeDest =
    dest && dest.startsWith('/') && !dest.startsWith('//') ? dest : '/dashboard';

  redirect(safeDest);
}
