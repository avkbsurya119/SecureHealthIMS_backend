import express from 'express'
import { supabase } from '../config/supabaseClient.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const { error } = await supabase
    .from('patients')
    .select('id')
    .limit(1)

  if (error) {
    return res.status(500).json({ status: 'down', error: error.message })
  }

  res.json({ status: 'up' })
})

export default router
