import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  try {
    const { data, error } = await supabase.from('visits').select('*').limit(1);
    console.log('--- ERROR ---');
    console.log(error);
    console.log('--- DATA ---');
    console.log(data);
    
    // Explicitly check for columns by trying to select them
    console.log('--- COLUMN PROBE ---');
    const { error: errF } = await supabase.from('visits').select('findings').limit(1);
    
    const { error: errD } = await supabase.from('visits').select('diagnosis').limit(1);
    if (errD) console.log('Diagnosis error message:', errD.message);

  } catch (e) {
    console.error(e);
  }
}
run();
