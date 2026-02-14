/**
 * Supabase Client Configuration
 * Initializes the connection to the medical database using the service role key.
 * This client is used for all backend database interactions.
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const testSupabaseConnection = async () => {
  const { error } = await supabase
    .from('patients')
    .select('id')
    .limit(1)

  if (error) {
    console.error('Supabase connection failed:', error.message)
  } else {
    console.log('Supabase connected successfully')
  }
}
