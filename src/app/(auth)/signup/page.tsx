import React from 'react'
import SignupForm from '@/components/auth/signup-form'

export const metadata = {
  title: 'Sign Up',
}

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Create your account</h2>
      <SignupForm />
    </div>
  )
}
