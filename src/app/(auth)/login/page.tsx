import { Suspense } from 'react';
import LoginForm from '@/components/auth/login-form'

export const metadata = {
  title: 'Login',
}

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Sign in to your account</h2>
      <Suspense fallback={<div className="text-center py-8 text-gray-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
