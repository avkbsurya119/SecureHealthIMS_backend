import express from 'express'
import { supabase } from '../config/supabaseClient.js'

const router = express.Router()

// GET all patients
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
})

// GET single patient by ID
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error) {
    return res.status(404).json({ error: 'Patient not found' })
  }

  res.json(data)
})

// POST create new patient
router.post('/', async (req, res) => {
  const { name, dob, gender, phone, address } = req.body

  const { data, error } = await supabase
    .from('patients')
    .insert([{ name, dob, gender, phone, address }])
    .select()
    .single()

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  res.status(201).json(data)
})

export default router
