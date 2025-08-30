import pool from '@/db';

// Resolve an active tenant's schema name from a subdomain.
export async function getTenantSchema(subdomain?: string): Promise<string | null> {
  const sd = (subdomain || process.env.DEFAULT_TENANT_SUBDOMAIN || 'sampletenant').toLowerCase();
  const { rows } = await pool.query(
    `SELECT schema_name FROM public.tenants WHERE subdomain = $1 AND status = 'active'`,
    [sd]
  );
  if (!rows.length) return null;
  const schema = rows[0].schema_name as string;
  // Basic safety: ensure schema conforms to expected pattern (e.g., tenant_acme)
  if (!/^tenant_[a-z0-9_]+$/.test(schema)) return null;
  return schema;
}
