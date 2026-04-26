import React from 'react'
import Link from 'next/link'

export const metadata = { title: 'Check your email' }

export default function CheckEmailPage() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-4">Check your email</h2>
      <p className="mb-4">We sent you an email to verify your account. Click the link in the email to continue.</p>
      <Link href="/login" className="text-sm text-primary underline">Back to login</Link>
    </div>
  )
}
