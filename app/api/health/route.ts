import pool from '@/db';
import { getBootstrapStatus } from '@/lib/bootstrap-status';

export const runtime = 'nodejs';

export async function GET() {
  // Check DB connectivity quickly
  let dbOk = true
  try {
    await pool.query('SELECT 1')
  } catch {
    dbOk = false
  }

  const status = getBootstrapStatus()
  return new Response(
    JSON.stringify({
      ok: (status.ok ?? true) && dbOk,
      dbOk,
      bootstrap: status,
    }),
    { headers: { 'content-type': 'application/json' } }
  )
}
