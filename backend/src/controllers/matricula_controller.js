import Matricula from "../models/Matricula.js"
import Estudiante from "../models/Estudiante.js"
import Materia from "../models/Materia.js"

/**
 * Función helper para calcular y retornar créditos
 * Se ejecuta cada vez que se consultan datos de la matrícula
 */
const calcularCreditos = async (matricula) => {
    if (!matricula.materias || matricula.materias.length === 0) {
        matricula.creditosCalculados = 0
        return 0
    }

    // Poblar las materias para obtener los créditos
    await matricula.populate('materias', 'creditos')
    
    let totalCreditos = 0
    for (const materia of matricula.materias) {
        if (materia && materia.creditos) {
            totalCreditos += Number(materia.creditos) || 0
        }
    }

    matricula.creditosCalculados = totalCreditos
    return totalCreditos
}

// ===== CRUD MATRICULAS =====

/**
 * Listar todas las matrículas
 * GET /matriculas
 */
const listarMatriculas = async (req, res) => {
    try {
        let matriculas = await Matricula.find()
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')
            .select('-__v')
        
        // Calcular créditos para cada matrícula
        for (let matricula of matriculas) {
            await calcularCreditos(matricula)
        }

        res.status(200).json({
            msg: "Matrículas listadas correctamente",
            total: matriculas.length,
            matriculas
        })
    } catch (error) {
        console.error("Error al listar matrículas:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Obtener detalle de una matrícula
 * GET /matriculas/:id
 */
const detalleMatricula = async (req, res) => {
    try {
        const { id } = req.params
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID inválido" })
        }
        
        let matricula = await Matricula.findById(id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')
            .select('-__v')
        
        if (!matricula) {
            return res.status(404).json({ msg: "Matrícula no encontrada" })
        }

        // Calcular créditos
        await calcularCreditos(matricula)
        
        res.status(200).json({
            msg: "Matrícula encontrada",
            matricula
        })
    } catch (error) {
        console.error("Error:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Crear una nueva matrícula
 * POST /matriculas
 * Body: {
 *   "id_estudiante": "...",
 *   "codigo": "MAT2024-001",
 *   "descripcion": "Matrícula 2024",
 *   "materias": ["id_materia1", "id_materia2"]
 * }
 */
const crearMatricula = async (req, res) => {
    try {
        const { id_estudiante, codigo, descripcion, materias } = req.body

        console.log("📨 Datos recibidos:", req.body)

        // Validaciones básicas
        if (!id_estudiante) {
            return res.status(400).json({ msg: "El id_estudiante es obligatorio" })
        }

        if (!codigo) {
            return res.status(400).json({ msg: "El código es obligatorio" })
        }

        if (!id_estudiante.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de estudiante inválido" })
        }

        // Verificar que el estudiante existe
        console.log("🔍 Buscando estudiante...")
        const estudiante = await Estudiante.findById(id_estudiante)
        if (!estudiante) {
            return res.status(404).json({ msg: "Estudiante no encontrado" })
        }
        console.log("✅ Estudiante encontrado:", estudiante.nombre)

        // Verificar que el estudiante no tenga ya una matrícula
        const matriculaExistente = await Matricula.findOne({ id_estudiante })
        if (matriculaExistente) {
            return res.status(400).json({ msg: "El estudiante ya tiene una matrícula" })
        }

        // Verificar que el código no esté repetido
        const codigoExistente = await Matricula.findOne({ codigo })
        if (codigoExistente) {
            return res.status(400).json({ msg: "Ya existe una matrícula con este código" })
        }

        // Validar y procesar materias
        let materiasValidas = []
        
        if (materias && Array.isArray(materias) && materias.length > 0) {
            const materiasSet = new Set()

            for (const id_materia of materias) {
                // Validar formato
                if (!id_materia.match(/^[0-9a-fA-F]{24}$/)) {
                    return res.status(400).json({ msg: `ID de materia inválido: ${id_materia}` })
                }

                // Validar que no esté repetida
                if (materiasSet.has(id_materia)) {
                    return res.status(400).json({ msg: "No se pueden agregar materias repetidas" })
                }
                materiasSet.add(id_materia)

                // Verificar que la materia existe
                console.log("🔍 Buscando materia...")
                const materia = await Materia.findById(id_materia)
                if (!materia) {
                    return res.status(404).json({ msg: `Materia ${id_materia} no encontrada` })
                }
                console.log("✅ Materia encontrada:", materia.nombre)

                materiasValidas.push(id_materia)
            }
        }

        // Crear la matrícula
        const nuevaMatricula = new Matricula({
            id_estudiante,
            codigo: codigo.trim(),
            descripcion: descripcion ? descripcion.trim() : null,
            materias: materiasValidas
        })

        await nuevaMatricula.save()
        console.log("✅ Matrícula creada")

        // Retornar con datos poblados
        let matriculaConDatos = await Matricula.findById(nuevaMatricula._id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')

        // Calcular créditos
        await calcularCreditos(matriculaConDatos)

        res.status(201).json({
            msg: "Matrícula creada correctamente",
            matricula: matriculaConDatos
        })

    } catch (error) {
        console.error("❌ Error:", error.message)
        
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0]
            return res.status(400).json({ msg: `Ya existe una matrícula con este ${campo}` })
        }

        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Agregar una materia a la matrícula
 * POST /matriculas/:id/materias
 * Body: { "id_materia": "..." }
 */
const agregarMateria = async (req, res) => {
    try {
        const { id } = req.params
        const { id_materia } = req.body

        console.log("📨 Agregando materia:", id_materia)

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de matrícula inválido" })
        }

        if (!id_materia || !id_materia.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de materia inválido" })
        }

        // Obtener la matrícula
        const matricula = await Matricula.findById(id)
        if (!matricula) {
            return res.status(404).json({ msg: "Matrícula no encontrada" })
        }

        // Verificar que la materia existe
        console.log("🔍 Verificando materia...")
        const materia = await Materia.findById(id_materia)
        if (!materia) {
            return res.status(404).json({ msg: "Materia no encontrada" })
        }
        console.log("✅ Materia encontrada:", materia.nombre)

        // Verificar que no esté ya en la matrícula
        if (matricula.materias.some(m => m.toString() === id_materia)) {
            return res.status(400).json({ msg: "Esta materia ya está en la matrícula" })
        }

        // Agregar
        matricula.materias.push(id_materia)
        await matricula.save()
        console.log("✅ Materia agregada")

        // Retornar actualizada
        let matriculaActualizada = await Matricula.findById(id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')

        // Calcular créditos
        await calcularCreditos(matriculaActualizada)

        res.status(200).json({
            msg: "Materia agregada correctamente",
            matricula: matriculaActualizada
        })

    } catch (error) {
        console.error("❌ Error:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Eliminar una materia de la matrícula
 * DELETE /matriculas/:id/materias/:idMateria
 */
const eliminarMateria = async (req, res) => {
    try {
        const { id, idMateria } = req.params

        console.log("🗑️ Eliminando materia:", idMateria)

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de matrícula inválido" })
        }

        if (!idMateria.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de materia inválido" })
        }

        const matricula = await Matricula.findById(id)
        if (!matricula) {
            return res.status(404).json({ msg: "Matrícula no encontrada" })
        }

        // Verificar que la materia está en la matrícula
        if (!matricula.materias.some(m => m.toString() === idMateria)) {
            return res.status(404).json({ msg: "Materia no encontrada en la matrícula" })
        }

        // Eliminar
        matricula.materias = matricula.materias.filter(m => m.toString() !== idMateria)
        await matricula.save()
        console.log("✅ Materia eliminada")

        // Retornar actualizada
        let matriculaActualizada = await Matricula.findById(id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')

        // Calcular créditos
        await calcularCreditos(matriculaActualizada)

        res.status(200).json({
            msg: "Materia eliminada correctamente",
            matricula: matriculaActualizada
        })

    } catch (error) {
        console.error("❌ Error:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Eliminar una matrícula
 * DELETE /matriculas/:id
 */
const eliminarMatricula = async (req, res) => {
    try {
        const { id } = req.params

        console.log("🗑️ Eliminando matrícula:", id)

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de matrícula inválido" })
        }

        let matricula = await Matricula.findByIdAndDelete(id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')

        if (!matricula) {
            return res.status(404).json({ msg: "Matrícula no encontrada" })
        }

        // Calcular créditos
        await calcularCreditos(matricula)

        console.log("✅ Matrícula eliminada")

        res.status(200).json({
            msg: "Matrícula eliminada correctamente",
            matricula
        })

    } catch (error) {
        console.error("❌ Error:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

export {
    listarMatriculas,
    detalleMatricula,
    crearMatricula,
    agregarMateria,
    eliminarMateria,
    eliminarMatricula
}
/**
 * Actualizar matrícula (código y descripción)
 * PUT /matriculas/:id
 */
const actualizarMatricula = async (req, res) => {
  try {
    const { id } = req.params
    const { codigo, descripcion, materias } = req.body

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: "ID inválido" })
    }

    if (!codigo && descripcion === undefined && !materias) {
      return res.status(400).json({ msg: "Debes enviar al menos un campo para actualizar" })
    }

    const matricula = await Matricula.findById(id)
    if (!matricula) return res.status(404).json({ msg: "Matrícula no encontrada" })

    if (codigo) {
      const existe = await Matricula.findOne({ codigo: codigo.trim(), _id: { $ne: id } })
      if (existe) return res.status(400).json({ msg: "Ya existe otra matrícula con este código" })
      matricula.codigo = codigo.trim()
    }

    if (descripcion !== undefined) matricula.descripcion = descripcion

    if (materias && Array.isArray(materias)) {
      const materiasValidas = []
      for (const id_materia of materias) {
        if (!id_materia.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ msg: `ID de materia inválido: ${id_materia}` })
        }
        const mat = await Materia.findById(id_materia)
        if (!mat) return res.status(404).json({ msg: `Materia ${id_materia} no encontrada` })
        materiasValidas.push(id_materia)
      }
      matricula.materias = materiasValidas
    }

    await matricula.save()

    const matriculaActualizada = await Matricula.findById(id)
      .populate('id_estudiante', 'nombre apellido cedula email')
      .populate('materias', 'nombre codigo creditos')

    await calcularCreditos(matriculaActualizada)

    res.status(200).json({ msg: "Matrícula actualizada correctamente", matricula: matriculaActualizada })

  } catch (error) {
    console.error("❌ Error:", error.message)
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
}mport Matricula from "../models/Matricula.js"
import Estudiante from "../models/Estudiante.js"
import Materia from "../models/Materia.js"

/**
 * Función helper para calcular y retornar créditos
 * Se ejecuta cada vez que se consultan datos de la matrícula
 */
const calcularCreditos = async (matricula) => {
    if (!matricula.materias || matricula.materias.length === 0) {
        matricula.creditosCalculados = 0
        return 0
    }

    // Poblar las materias para obtener los créditos
    await matricula.populate('materias', 'creditos')
    
    let totalCreditos = 0
    for (const materia of matricula.materias) {
        if (materia && materia.creditos) {
            totalCreditos += Number(materia.creditos) || 0
        }
    }

    matricula.creditosCalculados = totalCreditos
    return totalCreditos
}

// ===== CRUD MATRICULAS =====

/**
 * Listar todas las matrículas
 * GET /matriculas
 */
const listarMatriculas = async (req, res) => {
    try {
        let matriculas = await Matricula.find()
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')
            .select('-__v')
        
        // Calcular créditos para cada matrícula
        for (let matricula of matriculas) {
            await calcularCreditos(matricula)
        }

        res.status(200).json({
            msg: "Matrículas listadas correctamente",
            total: matriculas.length,
            matriculas
        })
    } catch (error) {
        console.error("Error al listar matrículas:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Obtener detalle de una matrícula
 * GET /matriculas/:id
 */
const detalleMatricula = async (req, res) => {
    try {
        const { id } = req.params
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID inválido" })
        }
        
        let matricula = await Matricula.findById(id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')
            .select('-__v')
        
        if (!matricula) {
            return res.status(404).json({ msg: "Matrícula no encontrada" })
        }

        // Calcular créditos
        await calcularCreditos(matricula)
        
        res.status(200).json({
            msg: "Matrícula encontrada",
            matricula
        })
    } catch (error) {
        console.error("Error:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Crear una nueva matrícula
 * POST /matriculas
 * Body: {
 *   "id_estudiante": "...",
 *   "codigo": "MAT2024-001",
 *   "descripcion": "Matrícula 2024",
 *   "materias": ["id_materia1", "id_materia2"]
 * }
 */
const crearMatricula = async (req, res) => {
    try {
        const { id_estudiante, codigo, descripcion, materias } = req.body

        console.log("📨 Datos recibidos:", req.body)

        // Validaciones básicas
        if (!id_estudiante) {
            return res.status(400).json({ msg: "El id_estudiante es obligatorio" })
        }

        if (!codigo) {
            return res.status(400).json({ msg: "El código es obligatorio" })
        }

        if (!id_estudiante.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de estudiante inválido" })
        }

        // Verificar que el estudiante existe
        console.log("🔍 Buscando estudiante...")
        const estudiante = await Estudiante.findById(id_estudiante)
        if (!estudiante) {
            return res.status(404).json({ msg: "Estudiante no encontrado" })
        }
        console.log("✅ Estudiante encontrado:", estudiante.nombre)

        // Verificar que el estudiante no tenga ya una matrícula
        const matriculaExistente = await Matricula.findOne({ id_estudiante })
        if (matriculaExistente) {
            return res.status(400).json({ msg: "El estudiante ya tiene una matrícula" })
        }

        // Verificar que el código no esté repetido
        const codigoExistente = await Matricula.findOne({ codigo })
        if (codigoExistente) {
            return res.status(400).json({ msg: "Ya existe una matrícula con este código" })
        }

        // Validar y procesar materias
        let materiasValidas = []
        
        if (materias && Array.isArray(materias) && materias.length > 0) {
            const materiasSet = new Set()

            for (const id_materia of materias) {
                // Validar formato
                if (!id_materia.match(/^[0-9a-fA-F]{24}$/)) {
                    return res.status(400).json({ msg: `ID de materia inválido: ${id_materia}` })
                }

                // Validar que no esté repetida
                if (materiasSet.has(id_materia)) {
                    return res.status(400).json({ msg: "No se pueden agregar materias repetidas" })
                }
                materiasSet.add(id_materia)

                // Verificar que la materia existe
                console.log("🔍 Buscando materia...")
                const materia = await Materia.findById(id_materia)
                if (!materia) {
                    return res.status(404).json({ msg: `Materia ${id_materia} no encontrada` })
                }
                console.log("✅ Materia encontrada:", materia.nombre)

                materiasValidas.push(id_materia)
            }
        }

        // Crear la matrícula
        const nuevaMatricula = new Matricula({
            id_estudiante,
            codigo: codigo.trim(),
            descripcion: descripcion ? descripcion.trim() : null,
            materias: materiasValidas
        })

        await nuevaMatricula.save()
        console.log("✅ Matrícula creada")

        // Retornar con datos poblados
        let matriculaConDatos = await Matricula.findById(nuevaMatricula._id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')

        // Calcular créditos
        await calcularCreditos(matriculaConDatos)

        res.status(201).json({
            msg: "Matrícula creada correctamente",
            matricula: matriculaConDatos
        })

    } catch (error) {
        console.error("❌ Error:", error.message)
        
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0]
            return res.status(400).json({ msg: `Ya existe una matrícula con este ${campo}` })
        }

        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Agregar una materia a la matrícula
 * POST /matriculas/:id/materias
 * Body: { "id_materia": "..." }
 */
const agregarMateria = async (req, res) => {
    try {
        const { id } = req.params
        const { id_materia } = req.body

        console.log("📨 Agregando materia:", id_materia)

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de matrícula inválido" })
        }

        if (!id_materia || !id_materia.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de materia inválido" })
        }

        // Obtener la matrícula
        const matricula = await Matricula.findById(id)
        if (!matricula) {
            return res.status(404).json({ msg: "Matrícula no encontrada" })
        }

        // Verificar que la materia existe
        console.log("🔍 Verificando materia...")
        const materia = await Materia.findById(id_materia)
        if (!materia) {
            return res.status(404).json({ msg: "Materia no encontrada" })
        }
        console.log("✅ Materia encontrada:", materia.nombre)

        // Verificar que no esté ya en la matrícula
        if (matricula.materias.some(m => m.toString() === id_materia)) {
            return res.status(400).json({ msg: "Esta materia ya está en la matrícula" })
        }

        // Agregar
        matricula.materias.push(id_materia)
        await matricula.save()
        console.log("✅ Materia agregada")

        // Retornar actualizada
        let matriculaActualizada = await Matricula.findById(id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')

        // Calcular créditos
        await calcularCreditos(matriculaActualizada)

        res.status(200).json({
            msg: "Materia agregada correctamente",
            matricula: matriculaActualizada
        })

    } catch (error) {
        console.error("❌ Error:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Eliminar una materia de la matrícula
 * DELETE /matriculas/:id/materias/:idMateria
 */
const eliminarMateria = async (req, res) => {
    try {
        const { id, idMateria } = req.params

        console.log("🗑️ Eliminando materia:", idMateria)

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de matrícula inválido" })
        }

        if (!idMateria.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de materia inválido" })
        }

        const matricula = await Matricula.findById(id)
        if (!matricula) {
            return res.status(404).json({ msg: "Matrícula no encontrada" })
        }

        // Verificar que la materia está en la matrícula
        if (!matricula.materias.some(m => m.toString() === idMateria)) {
            return res.status(404).json({ msg: "Materia no encontrada en la matrícula" })
        }

        // Eliminar
        matricula.materias = matricula.materias.filter(m => m.toString() !== idMateria)
        await matricula.save()
        console.log("✅ Materia eliminada")

        // Retornar actualizada
        let matriculaActualizada = await Matricula.findById(id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')

        // Calcular créditos
        await calcularCreditos(matriculaActualizada)

        res.status(200).json({
            msg: "Materia eliminada correctamente",
            matricula: matriculaActualizada
        })

    } catch (error) {
        console.error("❌ Error:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

/**
 * Eliminar una matrícula
 * DELETE /matriculas/:id
 */
const eliminarMatricula = async (req, res) => {
    try {
        const { id } = req.params

        console.log("🗑️ Eliminando matrícula:", id)

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "ID de matrícula inválido" })
        }

        let matricula = await Matricula.findByIdAndDelete(id)
            .populate('id_estudiante', 'nombre apellido cedula email')
            .populate('materias', 'nombre codigo creditos')

        if (!matricula) {
            return res.status(404).json({ msg: "Matrícula no encontrada" })
        }

        // Calcular créditos
        await calcularCreditos(matricula)

        console.log("✅ Matrícula eliminada")

        res.status(200).json({
            msg: "Matrícula eliminada correctamente",
            matricula
        })

    } catch (error) {
        console.error("❌ Error:", error.message)
        res.status(500).json({ msg: `❌ Error - ${error.message}` })
    }
}

export {
    listarMatriculas,
    detalleMatricula,
    crearMatricula,
    agregarMateria,
    eliminarMateria,
    eliminarMatricula
}
/**
 * Actualizar matrícula (código y descripción)
 * PUT /matriculas/:id
 */
const actualizarMatricula = async (req, res) => {
  try {
    const { id } = req.params
    const { codigo, descripcion, materias } = req.body

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: "ID inválido" })
    }

    if (!codigo && descripcion === undefined && !materias) {
      return res.status(400).json({ msg: "Debes enviar al menos un campo para actualizar" })
    }

    const matricula = await Matricula.findById(id)
    if (!matricula) return res.status(404).json({ msg: "Matrícula no encontrada" })

    if (codigo) {
      const existe = await Matricula.findOne({ codigo: codigo.trim(), _id: { $ne: id } })
      if (existe) return res.status(400).json({ msg: "Ya existe otra matrícula con este código" })
      matricula.codigo = codigo.trim()
    }

    if (descripcion !== undefined) matricula.descripcion = descripcion

    if (materias && Array.isArray(materias)) {
      const materiasValidas = []
      for (const id_materia of materias) {
        if (!id_materia.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({ msg: `ID de materia inválido: ${id_materia}` })
        }
        const mat = await Materia.findById(id_materia)
        if (!mat) return res.status(404).json({ msg: `Materia ${id_materia} no encontrada` })
        materiasValidas.push(id_materia)
      }
      matricula.materias = materiasValidas
    }

    await matricula.save()

    const matriculaActualizada = await Matricula.findById(id)
      .populate('id_estudiante', 'nombre apellido cedula email')
      .populate('materias', 'nombre codigo creditos')

    await calcularCreditos(matriculaActualizada)

    res.status(200).json({ msg: "Matrícula actualizada correctamente", matricula: matriculaActualizada })

  } catch (error) {
    console.error("❌ Error:", error.message)
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
