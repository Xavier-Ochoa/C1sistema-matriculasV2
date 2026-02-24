import express from "express"
import cors from "cors"
import authRoutes from "./routes/auth_routes.js"
import estudianteRoutes from "./routes/estudiante_routes.js"
import materiaRoutes from "./routes/materia_routes.js"
import matriculaRoutes from "./routes/matricula_routes.js"

const app = express()

// CORS abierto — compatible con Vercel Serverless
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.options('*', cors())

app.use(express.json())

app.get("/", (req, res) => {
  res.send("API de Sistema de Gestión de Matrículas - TSDS")
})

app.use("/api/auth", authRoutes)
app.use("/api/estudiantes", estudianteRoutes)
app.use("/api/materias", materiaRoutes)
app.use("/api/matriculas", matriculaRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint no encontrado - 404" })
})

app.use((err, req, res, next) => {
  console.error('❌ Error:', err)
  res.status(500).json({ success: false, message: 'Error interno del servidor' })
})

export default app
