import pool from './index';
import bcrypt from 'bcryptjs';
import { markStart, recordLog, markSuccess } from '../lib/bootstrap-status';

// Resolve db-functions at runtime from project root to work after bundling
function getDbFunctionsDir() {
    return `${process.cwd()}/db-functions`;
}
const SAMPLE_SUPER_ADMIN_EMAIL = 'admin@sample.com';
const SAMPLE_TENANT_SUBDOMAIN = 'sampletenant';

async function syncDbFunctions() {
    const { readdir, readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const dir = getDbFunctionsDir();
    // Ensure deterministic order (01_, 02_, 03_ ...)
    const all = await readdir(dir);
    const files = all.filter(f => f.endsWith('.sql')).sort((a, b) => a.localeCompare(b));

    for (const file of files) {
        recordLog(`[SQL] Applying ${file}`);
        const sql = await readFile(join(dir, file), 'utf-8');
        try {
            // Execute full file to preserve $$ function bodies and semicolons inside
            await pool.query(sql);
            recordLog(`[SQL] Applied ${file}`);
        } catch (err) {
            if (err instanceof Error) {
                if (!/already exists|duplicate|already defined/i.test(err.message)) {
                    console.error(`Error running SQL from ${file}:`, err.message);
                    recordLog(`[SQL] Error in ${file}: ${err.message}`);
                }
            } else {
                console.error(`Unknown error running SQL from ${file}:`, err);
                recordLog(`[SQL] Unknown error in ${file}`);
            }
        }
    }
}

export async function bootstrapDatabase() {
    markStart();
    recordLog('Syncing database functions and schemas');
    await syncDbFunctions();

    // Check if sample super admin exists
    recordLog('Checking/creating sample super admin');
    const superAdminRes = await pool.query(
        'SELECT id FROM public.super_admins WHERE email = $1',
        [SAMPLE_SUPER_ADMIN_EMAIL]
    );

    let superAdminId: string;
    if (superAdminRes.rows.length === 0) {
        // Hash password using bcrypt
        const password = 'samplepassword';
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        // Create sample super admin
        const insertAdminRes = await pool.query(
            `INSERT INTO public.super_admins (name, email, password_hash, phone, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            ['Sample Admin', SAMPLE_SUPER_ADMIN_EMAIL, passwordHash, '1234567890', true]
        );
        superAdminId = insertAdminRes.rows[0].id;
        recordLog(`Created sample super admin ${SAMPLE_SUPER_ADMIN_EMAIL}`);
    } else {
        superAdminId = superAdminRes.rows[0].id;
        recordLog('Sample super admin exists');
    }

    // Check if sample tenant exists
    const tenantRes = await pool.query(
        'SELECT id FROM public.tenants WHERE subdomain = $1',
        [SAMPLE_TENANT_SUBDOMAIN]
    );

    if (tenantRes.rows.length === 0) {
        // Onboard sample tenant using onboard_tenant function
        recordLog(`Onboarding tenant ${SAMPLE_TENANT_SUBDOMAIN}`);
        await pool.query(
            `SELECT onboard_tenant($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                'Sample Company',
                SAMPLE_TENANT_SUBDOMAIN,
                'SAMPLECODE',
                'contact@sample.com',
                '1234567890',
                'Sample Address',
                'Sample City',
                'Sample State',
                superAdminId
            ]
        );
        recordLog('Tenant onboarded');
    }

    markSuccess();
}
