'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function requestPasswordReset(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: true } | null> {
  const parsed = schema.safeParse({ email: formData.get('email') });

  if (!parsed.success) {
    return { error: 'Invalid email' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
