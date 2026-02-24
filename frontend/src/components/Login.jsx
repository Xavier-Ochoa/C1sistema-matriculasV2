import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authAPI.login(email, password)
      const { token, nombre, apellido, _id } = response.data
      localStorage.setItem('token_caso1', token)
      localStorage.setItem('usuario_caso1', JSON.stringify({ nombre, apellido, _id }))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.msg || 'Usuario o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🎓 Gestión de Matrículas</h1>
        <p className="login-subtitle">Sistema de Administración Académica</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Clave:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="error">⚠️ {error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>
      </div>

      <style>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .login-box {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.25);
          width: 100%;
          max-width: 400px;
        }
        .login-box h1 { text-align: center; margin-bottom: 6px; color: #333; font-size: 24px; }
        .login-subtitle { text-align: center; color: #888; font-size: 13px; margin-bottom: 28px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 5px; color: #555; font-weight: 500; }
        .form-group input {
          width: 100%; padding: 10px 12px; border: 1px solid #ddd;
          border-radius: 6px; font-size: 14px; box-sizing: border-box;
        }
        .form-group input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
        button {
          width: 100%; padding: 12px; background: #667eea; color: white;
          border: none; border-radius: 6px; font-size: 16px; font-weight: bold;
          cursor: pointer; transition: background 0.3s;
        }
        button:hover { background: #5568d3; }
        button:disabled { background: #aaa; cursor: not-allowed; }
        .error { color: #e74c3c; background: #fdf0f0; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 14px; }
      `}</style>
    </div>
  )
}
