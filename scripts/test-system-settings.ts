import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'api', '.env') });
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kifhkrbvxzdubfoglvvk.supabase.co',
  process.env.SUPABASE_SECRET_KEY!
);

async function testSettings() {
  const { data, error } = await supabase.from('system_settings').select('*');
  console.log('system_settings status:', error ? error.message : 'Table exists! Items: ' + JSON.stringify(data));
}

testSettings();
