"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type Point = { date: string; amount: number }

export default function RevenueTrend({ data }: { data: Point[] }) {
  if (!data?.length) return <div className="h-64 flex items-center justify-center text-[#666]">No data</div>
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
          <Legend />
          <Line type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Revenue" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
