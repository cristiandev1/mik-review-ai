'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const hasCalledRef = useRef(false)

  useEffect(() => {
    async function handleCallback() {
      if (!code || hasCalledRef.current) return
      
      hasCalledRef.current = true

      try {
        const response = await api.post('/auth/github/callback', { code })
        
        const { token, user } = response.data.data
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        router.push('/dashboard')
      } catch (error) {
        console.error('GitHub Auth Failed:', error)
        router.push('/login?error=github_failed')
      }
    }

    handleCallback()
  }, [code, router])

  if (!code) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">Invalid Request</CardTitle>
          </CardHeader>
          <CardContent>
            No authorization code found. Please try logging in again.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground">Authenticating with GitHub...</p>
    </div>
  )
}
