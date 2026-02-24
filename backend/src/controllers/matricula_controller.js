import Matricula from "../models/Matricula.js"
import Estudiante from "../models/Estudiante.js"
import Materia from "../models/Materia.js"

const calcularCreditos = (matricula) => {
  if (!matricula.materias || matricula.materias.length === 0) {
    matricula.creditosCalculados = 0
    return 0
  }
  let total = 0
  for (const mat of matricula.materias) {
    if (mat && mat.creditos) total += Number(mat.creditos) || 0
  }
  matricula.creditosCalculados = total
  return total
}

const listarMatriculas = async (req, res) => {
  try {
    let matriculas = await Matricula.find()
      .populate('id_estudiante', 'nombre apellido cedula email')
      .populate('materias', 'nombre codigo creditos')
      .select('-__v')
    for (let m of matriculas) calcularCreditos(m)
    res.status(200).json({ msg: "Matrículas listadas correctamente", total: matriculas.length, matriculas })
  } catch (error) {
    res.status(500).json({ msg: `❌ Error - ${error.message}` })
  }
}

const detalleMatricula = async (req, res) => {
  try {
    const { id } = req.params
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: "ID inválido" })
    let matricula = await Matricula.findById(id)
      .populate('id_estudiante', 'nombre apellido cedula email')
      .populate('materias', 'nombre codigo creditos')
      .select('-__v')
    if (!matricula) return res.status(404).json({ msg: "Matrícula no encontrada" })
    calcularCreditos(matricula)
    res.status(200).json({ msg: "Matrícula encontrada", matricula })
  } catch (error) {
    res.status(500).json({ msg: `❌ Error - ${error.message}` })
  }
}

const crearMatricula = async (req, res) => {
  try {
    const { id_estudiante, codigo, descripcion, materias } = req.body
    if (!id_estudiante) return res.status(400).json({ msg: "El id_estudiante es obligatorio" })
    if (!codigo)        return res.status(400).json({ msg: "El código es obligatorio" })
    if (!id_estudiante.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: "ID de estudiante inválido" })

    const estudiante = await Estudiante.findById(id_estudiante)
    if (!estudiante) return res.status(404).json({ msg: "Estudiante no encontrado" })

    if (await Matricula.findOne({ id_estudiante }))
      return res.status(400).json({ msg: "El estudiante ya tiene una matrícula" })
    if (await Matricula.findOne({ codigo }))
      return res.status(400).json({ msg: "Ya existe una matrícula con este código" })

    let materiasValidas = []
    if (materias && Array.isArray(materias) && materias.length > 0) {
      const set = new Set()
      for (const id_mat of materias) {
        if (!id_mat.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: `ID de materia inválido: ${id_mat}` })
        if (set.has(id_mat)) return res.status(400).json({ msg: "No se pueden agregar materias repetidas" })
        set.add(id_mat)
        if (!await Materia.findById(id_mat)) return res.status(404).json({ msg: `Materia ${id_mat} no encontrada` })
        materiasValidas.push(id_mat)
      }
    }

    const nueva = new Matricula({ id_estudiante, codigo: codigo.trim(), descripcion: descripcion || null, materias: materiasValidas })
    await nueva.save()

    let matricula = await Matricula.findById(nueva._id)
      .populate('id_estudiante', 'nombre apellido cedula email')
      .populate('materias', 'nombre codigo creditos')
    calcularCreditos(matricula)
    res.status(201).json({ msg: "Matrícula creada correctamente", matricula })
  } catch (error) {
    if (error.code === 11000) {
      const campo = Object.keys(error.keyPattern)[0]
      return res.status(400).json({ msg: `Ya existe una matrícula con este ${campo}` })
    }
    res.status(500).json({ msg: `❌ Error - ${error.message}` })
  }
}

const actualizarMatricula = async (req, res) => {
  try {
    const { id } = req.params
    const { codigo, descripcion, materias } = req.body
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: "ID inválido" })

    const matricula = await Matricula.findById(id)
    if (!matricula) return res.status(404).json({ msg: "Matrícula no encontrada" })

    if (codigo) {
      const existe = await Matricula.findOne({ codigo: codigo.trim(), _id: { $ne: id } })
      if (existe) return res.status(400).json({ msg: "Ya existe otra matrícula con este código" })
      matricula.codigo = codigo.trim()
    }
    if (descripcion !== undefined) matricula.descripcion = descripcion

    if (materias && Array.isArray(materias)) {
      const validas = []
      for (const id_mat of materias) {
        if (!id_mat.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: `ID de materia inválido: ${id_mat}` })
        if (!await Materia.findById(id_mat)) return res.status(404).json({ msg: `Materia ${id_mat} no encontrada` })
        validas.push(id_mat)
      }
      matricula.materias = validas
    }

    await matricula.save()
    let actualizada = await Matricula.findById(id)
      .populate('id_estudiante', 'nombre apellido cedula email')
      .populate('materias', 'nombre codigo creditos')
    calcularCreditos(actualizada)
    res.status(200).json({ msg: "Matrícula actualizada correctamente", matricula: actualizada })
  } catch (error) {
    res.status(500).json({ msg: `❌ Error - ${error.message}` })
  }
}

const agregarMateria = async (req, res) => {
  try {
    const { id } = req.params
    const { id_materia } = req.body
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: "ID de matrícula inválido" })
    if (!id_materia || !id_materia.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: "ID de materia inválido" })

    const matricula = await Matricula.findById(id)
    if (!matricula) return res.status(404).json({ msg: "Matrícula no encontrada" })
    if (!await Materia.findById(id_materia)) return res.status(404).json({ msg: "Materia no encontrada" })
    if (matricula.materias.some(m => m.toString() === id_materia))
      return res.status(400).json({ msg: "Esta materia ya está en la matrícula" })

    matricula.materias.push(id_materia)
    await matricula.save()

    let actualizada = await Matricula.findById(id)
      .populate('id_estudiante', 'nombre apellido cedula email')
      .populate('materias', 'nombre codigo creditos')
    calcularCreditos(actualizada)
    res.status(200).json({ msg: "Materia agregada correctamente", matricula: actualizada })
  } catch (error) {
    res.status(500).json({ msg: `❌ Error - ${error.message}` })
  }
}

const eliminarMateria = async (req, res) => {
  try {
    const { id, idMateria } = req.params
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: "ID de matrícula inválido" })
    if (!idMateria.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: "ID de materia inválido" })

    const matricula = await Matricula.findById(id)
    if (!matricula) return res.status(404).json({ msg: "Matrícula no encontrada" })
    if (!matricula.materias.some(m => m.toString() === idMateria))
      return res.status(404).json({ msg: "Materia no encontrada en la matrícula" })

    matricula.materias = matricula.materias.filter(m => m.toString() !== idMateria)
    await matricula.save()

    let actualizada = await Matricula.findById(id)
      .populate('id_estudiante', 'nombre apellido cedula email')
      .populate('materias', 'nombre codigo creditos')
    calcularCreditos(actualizada)
    res.status(200).json({ msg: "Materia eliminada correctamente", matricula: actualizada })
  } catch (error) {
    res.status(500).json({ msg: `❌ Error - ${error.message}` })
  }
}

const eliminarMatricula = async (req, res) => {
  try {
    const { id } = req.params
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ msg: "ID de matrícula inválido" })

    let matricula = await Matricula.findByIdAndDelete(id)
      .populate('id_estudiante', 'nombre apellido cedula email')
      .populate('materias', 'nombre codigo creditos')
    if (!matricula) return res.status(404).json({ msg: "Matrícula no encontrada" })

    calcularCreditos(matricula)
    res.status(200).json({ msg: "Matrícula eliminada correctamente", matricula })
  } catch (error) {
    res.status(500).json({ msg: `❌ Error - ${error.message}` })
  }
}

export {
  listarMatriculas,
  detalleMatricula,
  crearMatricula,
  actualizarMatricula,
  agregarMateria,
  eliminarMateria,
  eliminarMatricula
}
