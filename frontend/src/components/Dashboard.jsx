import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Estudiantes from './pages/Estudiantes'
import Materias from './pages/Materias'
import Matriculas from './pages/Matriculas'
import './styles.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const [seccion, setSeccion] = useState('matriculas')

  const usuario = JSON.parse(localStorage.getItem('usuario_caso1') || '{}')
  const nombreUsuario = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Usuario'

  const handleLogout = () => {
    localStorage.removeItem('token_caso1')
    localStorage.removeItem('usuario_caso1')
    navigate('/login')
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>📚 Gestión de Matrículas</h1>
        <div className="nav-buttons">
          <button className={seccion === 'matriculas'  ? 'active' : ''} onClick={() => setSeccion('matriculas')}>Matrículas</button>
          <button className={seccion === 'estudiantes' ? 'active' : ''} onClick={() => setSeccion('estudiantes')}>Estudiantes</button>
          <button className={seccion === 'materias'    ? 'active' : ''} onClick={() => setSeccion('materias')}>Materias</button>
          <span className="usuario-nombre">👤 {nombreUsuario}</span>
          <button className="logout-btn" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </nav>

      <main className="content">
        <div className="bienvenida">
          Bienvenido - {nombreUsuario}
        </div>
        {seccion === 'matriculas'  && <Matriculas />}
        {seccion === 'estudiantes' && <Estudiantes />}
        {seccion === 'materias'    && <Materias />}
      </main>
    </div>
  )
}
