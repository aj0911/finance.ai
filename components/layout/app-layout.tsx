"use client"

import type React from "react"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { AuthProvider } from "@/hooks/use-auth"
import { ProtectedRoute } from "@/components/auth/protected-route"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    </AuthProvider>
  )
}
