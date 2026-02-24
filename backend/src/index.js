import 'dotenv/config'
import mongoose from 'mongoose'
import app from './server.js'

let isConnected = false

const conectarDB = async () => {
  if (isConnected) return
  await mongoose.connect(process.env.MONGODB_URI)
  isConnected = true
  console.log('✅ Conectado a MongoDB - caso1')
}

// LOCAL
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000
  conectarDB()
    .then(() => app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`)))
    .catch(err => { console.error('❌ Error:', err.message); process.exit(1) })
}

// VERCEL serverless handler
export default async (req, res) => {
  await conectarDB()
  app(req, res)
}
