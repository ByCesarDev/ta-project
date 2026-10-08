import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kifhkrbvxzdubfoglvvk.supabase.co',
  process.env.SUPABASE_SECRET_KEY!
);

async function testAuditLogsStorage() {
  console.log('Testing saving clearance to public.audit_logs in Supabase...');

  const { data: inserted, error: insErr } = await supabase
    .from('audit_logs')
    .insert({
      action: 'CLOUDFLARE_CLEARANCE_SYNC',
      entity_type: 'SYSTEM_CONFIG',
      entity_id: 'cf_clearance',
      metadata: {
        cookie: 'test-cookie-123456789',
        userAgent: 'Mozilla/5.0 Chrome/124.0.0.0',
        updatedAt: new Date().toISOString(),
      },
    })
    .select();

  if (insErr) {
    console.error('Insert error:', insErr.message);
    return;
  }
  console.log('Insert success!', inserted);

  const { data: queried, error: qErr } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', 'CLOUDFLARE_CLEARANCE_SYNC')
    .eq('entity_type', 'SYSTEM_CONFIG')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (qErr) {
    console.error('Query error:', qErr.message);
  } else {
    console.log('Query success! Retrieved metadata:', queried.metadata);
  }
}

testAuditLogsStorage();
