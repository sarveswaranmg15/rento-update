import { NextResponse } from 'next/server';
import { bootstrapDatabase } from '@/db/bootstrap';

export async function GET() {
    try {
        await bootstrapDatabase();
        return NextResponse.json({ success: true, message: 'Database bootstrap completed.' });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
    }
}
