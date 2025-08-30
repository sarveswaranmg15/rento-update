import fs from 'fs';
import path from 'path';
import pool from './index';
import bcrypt from 'bcryptjs';

const DB_FUNCTIONS_DIR = path.join(__dirname, '../db-functions');
const SAMPLE_SUPER_ADMIN_EMAIL = 'admin@sample.com';
const SAMPLE_TENANT_SUBDOMAIN = 'sampletenant';

async function syncDbFunctions() {
    const files = fs.readdirSync(DB_FUNCTIONS_DIR).filter(f => f.endsWith('.sql'));
    for (const file of files) {
        const sql = fs.readFileSync(path.join(DB_FUNCTIONS_DIR, file), 'utf-8');
        // Split on semicolon for multiple statements, but keep PL/pgSQL blocks intact
        const statements = sql.match(/(?:[^;']|'[^']*')+/g) || [];
        for (const stmt of statements) {
            const trimmed = stmt.trim();
            if (trimmed.length > 0) {
                try {
                    await pool.query(trimmed);
                } catch (err) {
                    // Ignore 'already exists' errors, log others
                    if (err instanceof Error) {
                        if (!/already exists|duplicate|already defined/i.test(err.message)) {
                            console.error(`Error running SQL from ${file}:`, err.message);
                        }
                    } else {
                        console.error(`Unknown error running SQL from ${file}:`, err);
                    }
                }
            }
        }
    }
}

export async function bootstrapDatabase() {
    await syncDbFunctions();

    // Check if sample super admin exists
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
    } else {
        superAdminId = superAdminRes.rows[0].id;
    }

    // Check if sample tenant exists
    const tenantRes = await pool.query(
        'SELECT id FROM public.tenants WHERE subdomain = $1',
        [SAMPLE_TENANT_SUBDOMAIN]
    );

    if (tenantRes.rows.length === 0) {
        // Onboard sample tenant using onboard_tenant function
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
    }
}
