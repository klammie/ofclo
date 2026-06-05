import { session } from '@/db/schema'
import { redirect } from 'next/navigation'
import React from 'react'

export default function DashboardPage() {
  if (session) return redirect("/dashboard/user/feed");
   
}
