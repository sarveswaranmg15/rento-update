"use client"
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

type Slice = { status: string; count: number }
const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#64748b']

export default function BookingStatusPie({ data }: { data: Slice[] }) {
  const total = data?.reduce((a, b) => a + (b.count || 0), 0) || 0
  if (!total) return <div className="h-64 flex items-center justify-center text-[#666]">No data</div>
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="status" outerRadius={80} label>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
