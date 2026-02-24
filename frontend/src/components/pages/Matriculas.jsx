import { useState, useEffect } from 'react'
import { matriculaAPI, estudianteAPI, materiaAPI } from '../../api'

export default function Matriculas() {
  const [matriculas, setMatriculas]       = useState([])
  const [estudiantes, setEstudiantes]     = useState([])
  const [materias, setMaterias]           = useState([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [showForm, setShowForm]           = useState(false)
  const [editingId, setEditingId]         = useState(null)
  const [selectedMatricula, setSelectedMatricula] = useState(null)
  const [showMateriaForm, setShowMateriaForm]     = useState(false)
  const [newMateria, setNewMateria]       = useState('')

  const [formData, setFormData] = useState({
    id_estudiante: '',
    codigo: '',
    descripcion: '',
    materias: []
  })

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async (selectedId = null) => {
    setLoading(true)
    try {
      const [matRes, estRes, materiasRes] = await Promise.all([
        matriculaAPI.listar(),
        estudianteAPI.listar(),
        materiaAPI.listar()
      ])
      const nuevasMatriculas = matRes.data.matriculas
      setMatriculas(nuevasMatriculas)
      setEstudiantes(estRes.data.estudiantes)
      setMaterias(materiasRes.data.materias)
      // Sincronizar selectedMatricula con datos frescos del servidor
      if (selectedId) {
        const fresca = nuevasMatriculas.find(m => m._id === selectedId)
        if (fresca) setSelectedMatricula(fresca)
      } else {
        setSelectedMatricula(prev =>
          prev ? (nuevasMatriculas.find(m => m._id === prev._id) || null) : null
        )
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const limpiarForm = () => {
    setFormData({ id_estudiante: '', codigo: '', descripcion: '', materias: [] })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (editingId) {
        await matriculaAPI.actualizar(editingId, {
          codigo: formData.codigo,
          descripcion: formData.descripcion,
          materias: formData.materias
        })
        setSuccess('✅ Matrícula actualizada correctamente')
      } else {
        await matriculaAPI.crear(formData)
        setSuccess('✅ Matrícula creada correctamente')
      }
      limpiarForm()
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al guardar matrícula')
    } finally {
      setLoading(false)
    }
  }

  const handleEditar = (mat) => {
    setFormData({
      id_estudiante: mat.id_estudiante._id,
      codigo: mat.codigo,
      descripcion: mat.descripcion || '',
      materias: mat.materias.map(m => m._id)
    })
    setEditingId(mat._id)
    setShowForm(true)
    setSelectedMatricula(null)
  }

  const handleAgregarMateria = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const matriculaId = selectedMatricula._id
      await matriculaAPI.agregarMateria(matriculaId, newMateria)
      setSuccess('✅ Materia agregada correctamente')
      setNewMateria('')
      setShowMateriaForm(false)
      await cargarDatos(matriculaId)
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al agregar materia')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarMateria = async (matriculaId, materiaId) => {
    if (!window.confirm('¿Eliminar esta materia de la matrícula?')) return
    setLoading(true)
    try {
      await matriculaAPI.eliminarMateria(matriculaId, materiaId)
      setSuccess('✅ Materia eliminada')
      await cargarDatos(matriculaId)
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al eliminar materia')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta matrícula completamente?')) return
    setLoading(true)
    try {
      await matriculaAPI.eliminar(id)
      setSuccess('✅ Matrícula eliminada')
      setSelectedMatricula(null)
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !matriculas.length) return <div className="container"><p>Cargando...</p></div>

  return (
    <div className="container">
      <div className="header">
        <h2>📋 Matrículas</h2>
        <button className="btn btn-primary" onClick={() => { limpiarForm(); setShowForm(!showForm) }}>
          {showForm ? '❌ Cancelar' : '➕ Nueva Matrícula'}
        </button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Estudiante:</label>
            <select
              value={formData.id_estudiante}
              onChange={(e) => setFormData({ ...formData, id_estudiante: e.target.value })}
              required
              disabled={!!editingId}
            >
              <option value="">Selecciona un estudiante</option>
              {estudiantes.map(est => (
                <option key={est._id} value={est._id}>
                  {est.nombre} {est.apellido} ({est.cedula})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Código:</label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="MAT2024-001"
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción:</label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la matrícula"
            />
          </div>

          <div className="form-group">
            <label>Materias:</label>
            <select
              multiple
              value={formData.materias}
              onChange={(e) => setFormData({
                ...formData,
                materias: Array.from(e.target.selectedOptions, o => o.value)
              })}
            >
              {materias.map(mat => (
                <option key={mat._id} value={mat._id}>
                  {mat.nombre} ({mat.codigo}) — {mat.creditos} créditos
                </option>
              ))}
            </select>
            <small>Usa Ctrl+Click para seleccionar múltiples</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Matrícula'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={limpiarForm}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="content-wrapper">
        <div className="list-section">
          <h3>Matrículas Registradas</h3>
          {matriculas.length === 0 ? (
            <p>No hay matrículas registradas</p>
          ) : (
            <ul className="list">
              {matriculas.map(mat => (
                <li
                  key={mat._id}
                  className={selectedMatricula?._id === mat._id ? 'active' : ''}
                  onClick={() => { setSelectedMatricula(mat); setShowForm(false) }}
                >
                  <strong>{mat.codigo}</strong> — {mat.id_estudiante?.nombre} {mat.id_estudiante?.apellido}
                  <br />
                  <small>{mat.materias.length} materias | {mat.creditosCalculados} créditos</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedMatricula && (
          <div className="detail-section">
            <h3>Detalle de Matrícula</h3>
            <div className="detail-box">
              <p><strong>Código:</strong> {selectedMatricula.codigo}</p>
              <p><strong>Estudiante:</strong> {selectedMatricula.id_estudiante?.nombre} {selectedMatricula.id_estudiante?.apellido}</p>
              <p><strong>Email:</strong> {selectedMatricula.id_estudiante?.email || 'N/A'}</p>
              <p><strong>Descripción:</strong> {selectedMatricula.descripcion || 'N/A'}</p>
              <p><strong>Créditos Totales:</strong> {selectedMatricula.creditosCalculados}</p>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-info btn-small" onClick={() => handleEditar(selectedMatricula)}>✏️ Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => handleEliminar(selectedMatricula._id)}>🗑️ Eliminar</button>
              </div>

              <h4 style={{ marginTop: '20px' }}>Materias Inscritas:</h4>
              {selectedMatricula.materias.length === 0 ? (
                <p>Sin materias</p>
              ) : (
                <ul className="materias-list">
                  {selectedMatricula.materias.map(mat => (
                    <li key={mat._id}>
                      <span><strong>{mat.nombre}</strong> ({mat.codigo}) — {mat.creditos} créditos</span>
                      <button className="btn btn-small btn-danger" onClick={() => handleEliminarMateria(selectedMatricula._id, mat._id)}>❌</button>
                    </li>
                  ))}
                </ul>
              )}

              {!showMateriaForm ? (
                <button className="btn btn-secondary" style={{ marginTop: '10px' }} onClick={() => setShowMateriaForm(true)}>
                  ➕ Agregar Materia
                </button>
              ) : (
                <form onSubmit={handleAgregarMateria} style={{ marginTop: '15px' }}>
                  <select value={newMateria} onChange={(e) => setNewMateria(e.target.value)} required>
                    <option value="">Selecciona una materia</option>
                    {materias
                      .filter(m => !selectedMatricula.materias.some(sm => sm._id === m._id))
                      .map(mat => (
                        <option key={mat._id} value={mat._id}>
                          {mat.nombre} ({mat.codigo}) — {mat.creditos} créditos
                        </option>
                      ))}
                  </select>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>Agregar</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowMateriaForm(false)}>Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
