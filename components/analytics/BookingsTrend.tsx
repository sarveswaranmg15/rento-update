"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type Point = { date: string; total: number; completed: number; cancelled: number }

export default function BookingsTrend({ data }: { data: Point[] }) {
  if (!data?.length) return <div className="h-64 flex items-center justify-center text-[#666]">No data</div>
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={8} minTickGap={24} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={false} name="Total" />
          <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} dot={false} name="Completed" />
          <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={false} name="Cancelled" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
