import Materia from "../models/Materia.js"

// ===== CRUD MATERIAS =====

/**
 * Listar todas las materias activas
 * GET /materias
 */
const listarMaterias = async (req, res) => {
    try {
        const materias = await Materia.find({ status: true }).select('-__v')
        
        if (materias.length === 0) {
            return res.status(200).json({
                msg: "No hay materias registradas",
                total: 0,
                materias: []
            })
        }
        
        res.status(200).json({
            msg: "Materias listadas correctamente",
            total: materias.length,
            materias
        })
    } catch (error) {
        console.error("Error al listar materias:", error.message)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

/**
 * Obtener detalle de una materia específica
 * GET /materias/:id
 */
const detalleMateria = async (req, res) => {
    try {
        const { id } = req.params
        
        // Validar que el ID sea un ObjectId válido
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                msg: "ID de materia inválido. Debe ser un ObjectId válido" 
            })
        }
        
        const materia = await Materia.findById(id).select('-__v')
        
        if (!materia) {
            return res.status(404).json({ msg: "Materia no encontrada" })
        }
        
        res.status(200).json({
            msg: "Materia encontrada",
            materia
        })
    } catch (error) {
        console.error("Error al obtener detalle de materia:", error.message)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

/**
 * Crear una nueva materia
 * POST /materias
 */
const crearMateria = async (req, res) => {
    try {
        const { nombre, codigo, descripcion, creditos } = req.body

        console.log("📨 Datos recibidos para crear materia:", req.body)

        // Validar campos obligatorios
        const camposObligatorios = ['nombre', 'codigo', 'creditos']
        const camposFaltantes = camposObligatorios.filter(campo => !req.body[campo])
        
        if (camposFaltantes.length > 0) {
            return res.status(400).json({
                msg: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}`
            })
        }

        // Validar que nombre sea un string válido
        if (typeof nombre !== 'string' || nombre.trim() === '') {
            return res.status(400).json({
                msg: "El nombre debe ser un texto válido"
            })
        }

        // Validar que codigo sea un string válido
        if (typeof codigo !== 'string' || codigo.trim() === '') {
            return res.status(400).json({
                msg: "El código debe ser un texto válido"
            })
        }

        // Validar que creditos sea un número
        const creditosNum = Number(creditos)
        if (isNaN(creditosNum) || creditosNum < 0) {
            return res.status(400).json({
                msg: "Los créditos deben ser un número válido"
            })
        }

        // Verificar si ya existe una materia con este CODIGO (NO con id)
        console.log("🔍 Verificando si existe materia con código:", codigo)
        const verificarCodigo = await Materia.findOne({ codigo: codigo.trim() })
        if (verificarCodigo) {
            console.log("⚠️ Ya existe materia con este código")
            return res.status(400).json({ 
                msg: "Ya existe una materia con este código" 
            })
        }

        // Crear la nueva materia
        const nuevaMateria = new Materia({
            nombre: nombre.trim(),
            codigo: codigo.trim(),
            descripcion: descripcion ? descripcion.trim() : null,
            creditos: creditosNum,
            status: true
        })

        // Guardar en la base de datos
        await nuevaMateria.save()
        console.log("✅ Materia creada correctamente con ID:", nuevaMateria._id)

        res.status(201).json({
            msg: "Materia creada correctamente",
            materia: nuevaMateria
        })

    } catch (error) {
        console.error("❌ Error al crear materia:", error.message)
        
        // Capturar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const mensajes = Object.values(error.errors).map(err => err.message)
            return res.status(400).json({ 
                msg: "Error de validación",
                errores: mensajes
            })
        }

        // Capturar errores de duplicación (índice único)
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0]
            return res.status(400).json({ 
                msg: `Ya existe una materia con este ${campo}` 
            })
        }

        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

/**
 * Actualizar una materia existente
 * PUT /materias/:id
 */
const actualizarMateria = async (req, res) => {
    try {
        const { id } = req.params
        const actualizaciones = req.body

        // Validar que el ID sea un ObjectId válido
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                msg: "ID de materia inválido. Debe ser un ObjectId válido" 
            })
        }

        // Verificar que se envíe al menos un campo para actualizar
        if (Object.keys(actualizaciones).length === 0) {
            return res.status(400).json({ 
                msg: "Debes enviar al menos un campo para actualizar" 
            })
        }

        // No permitir actualizar el status directamente (usar DELETE para eso)
        if (actualizaciones.status !== undefined) {
            delete actualizaciones.status
        }

        // Si se actualiza el código, validar que no exista otro con el mismo valor
        if (actualizaciones.codigo) {
            const codigoNormalizado = actualizaciones.codigo.trim()
            const codigoExistente = await Materia.findOne({ 
                codigo: codigoNormalizado,
                _id: { $ne: id }
            })
            if (codigoExistente) {
                return res.status(400).json({ 
                    msg: "Ya existe otra materia con este código" 
                })
            }
            actualizaciones.codigo = codigoNormalizado
        }

        // Normalizar nombre si se actualiza
        if (actualizaciones.nombre) {
            const nombreLimpio = actualizaciones.nombre.trim()
            if (nombreLimpio === '') {
                return res.status(400).json({
                    msg: "El nombre no puede estar vacío"
                })
            }
            actualizaciones.nombre = nombreLimpio
        }

        // Normalizar descripción si se actualiza
        if (actualizaciones.descripcion) {
            actualizaciones.descripcion = actualizaciones.descripcion.trim()
        }

        // Validar créditos si se actualiza
        if (actualizaciones.creditos !== undefined) {
            const creditosNum = Number(actualizaciones.creditos)
            if (isNaN(creditosNum) || creditosNum < 0) {
                return res.status(400).json({
                    msg: "Los créditos deben ser un número válido"
                })
            }
            actualizaciones.creditos = creditosNum
        }

        const materia = await Materia.findByIdAndUpdate(
            id,
            actualizaciones,
            { new: true, runValidators: true }
        ).select('-__v')

        if (!materia) {
            return res.status(404).json({ 
                msg: "Materia no encontrada" 
            })
        }

        res.status(200).json({
            msg: "Materia actualizada correctamente",
            materia
        })

    } catch (error) {
        console.error("Error al actualizar materia:", error.message)
        
        // Capturar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const mensajes = Object.values(error.errors).map(err => err.message)
            return res.status(400).json({ 
                msg: "Error de validación",
                errores: mensajes
            })
        }

        // Capturar errores de duplicación
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0]
            return res.status(400).json({ 
                msg: `Ya existe otra materia con este ${campo}` 
            })
        }

        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

/**
 * Eliminar (borrado físico) una materia
 * DELETE /materias/:id
 */
const eliminarMateria = async (req, res) => {
    try {
        const { id } = req.params

        // Validar que el ID sea un ObjectId válido
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                msg: "ID de materia inválido. Debe ser un ObjectId válido" 
            })
        }

        // Borrar físicamente de la BD
        const materia = await Materia.findByIdAndDelete(id).select('-__v')

        if (!materia) {
            return res.status(404).json({ 
                msg: "Materia no encontrada" 
            })
        }

        res.status(200).json({
            msg: "Materia eliminada correctamente",
            materia
        })

    } catch (error) {
        console.error("Error al eliminar materia:", error.message)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

export {
    listarMaterias,
    detalleMateria,
    crearMateria,
    actualizarMateria,
    eliminarMateria
}