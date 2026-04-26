import React from 'react'
import ForgotPasswordForm from '@/components/auth/forgot-password-form'

export const metadata = {
  title: 'Reset Password',
}

export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Reset your password</h2>
      <ForgotPasswordForm />
    </div>
  )
}
