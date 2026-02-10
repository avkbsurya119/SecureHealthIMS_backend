import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: users, error } = await supabase.from('users').select('id, email, role, full_name').limit(20);
  if (error) console.error(error.message);
  else console.log(JSON.stringify(users, null, 2));
}
run();
