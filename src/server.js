/**
 * Server Instance Initialization
 * Boots up the Express application and verifies database connectivity.
 */
import app from './app.js'
import { testSupabaseConnection } from './config/supabaseClient.js'

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  testSupabaseConnection()
})
