import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_caso1')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authAPI = {
  registro: (datos) => api.post('/auth/registro', datos),
  login:    (email, password) => api.post('/auth/login', { email, password }),
  perfil:   () => api.get('/auth/perfil')
}

export const estudianteAPI = {
  listar:     ()          => api.get('/estudiantes'),
  obtener:    (id)        => api.get(`/estudiantes/${id}`),
  crear:      (datos)     => api.post('/estudiantes', datos),
  actualizar: (id, datos) => api.put(`/estudiantes/${id}`, datos),
  eliminar:   (id)        => api.delete(`/estudiantes/${id}`)
}

export const materiaAPI = {
  listar:     ()          => api.get('/materias'),
  obtener:    (id)        => api.get(`/materias/${id}`),
  crear:      (datos)     => api.post('/materias', datos),
  actualizar: (id, datos) => api.put(`/materias/${id}`, datos),
  eliminar:   (id)        => api.delete(`/materias/${id}`)
}

export const matriculaAPI = {
  listar:         ()                    => api.get('/matriculas'),
  obtener:        (id)                  => api.get(`/matriculas/${id}`),
  crear:          (datos)               => api.post('/matriculas', datos),
  actualizar:     (id, datos)           => api.put(`/matriculas/${id}`, datos),
  agregarMateria: (id, id_materia)      => api.post(`/matriculas/${id}/materias`, { id_materia }),
  eliminarMateria:(id, idMateria)       => api.delete(`/matriculas/${id}/materias/${idMateria}`),
  eliminar:       (id)                  => api.delete(`/matriculas/${id}`)
}

export default api
