import express from 'express'
import cors from 'cors'

import healthRoutes from './routes/health.routes.js'
import patientsRoutes from './routes/patients.routes.js'

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}))

app.use(express.json())
app.use('/api/health', healthRoutes)
app.use('/api/patients', patientsRoutes)

export default app
