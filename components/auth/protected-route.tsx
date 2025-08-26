"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter();
  const currRoute = usePathname();

  useEffect(() => {
    
    if (!loading && !user) {
      router.push("/auth")
    }

    if(currRoute === '/auth' && user) router.push("/dashboard");
    
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (currRoute==='/auth' && user) {
    return null
  }

  if(currRoute !== '/' && currRoute !== '/auth' && !user) return null;

  return <>{children}</>
}
