require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const path     = require('path')

const app = express()

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logger (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`)
    next()
  })
}

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/customers',     require('./routes/customers'))
app.use('/api/suppliers',     require('./routes/suppliers'))
app.use('/api/products',      require('./routes/products'))
app.use('/api/orders',        require('./routes/orders'))
app.use('/api/installations', require('./routes/installations'))
app.use('/api/payments',      require('./routes/payments'))
app.use('/api/enquiries',     require('./routes/enquiries'))
app.use('/api/auth', require('./routes/auth'));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:  'ok',
    project: 'SolarTech Pro API',
    version: '1.0.0',
    time:    new Date().toISOString(),
  })
})

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// ─── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err.message)
  res.status(500).json({ message: 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n🚀 SolarTech Pro API running on http://localhost:${PORT}`)
  console.log(`📋 Health: http://localhost:${PORT}/api/health`)
  console.log(`🌍 Mode:   ${process.env.NODE_ENV || 'development'}\n`)
})
