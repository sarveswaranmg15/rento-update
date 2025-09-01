"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type Row = { name: string; users: number; drivers: number; bookings30d: number }

export default function PerTenantBars({ data }: { data: Row[] }) {
  if (!data?.length) return <div className="h-64 flex items-center justify-center text-[#666]">No data</div>
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="users" fill="#6366f1" name="Users" />
          <Bar dataKey="drivers" fill="#22c55e" name="Drivers" />
          <Bar dataKey="bookings30d" fill="#f59e0b" name="Bookings (30d)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
