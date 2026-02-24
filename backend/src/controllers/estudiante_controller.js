import Estudiante from "../models/Estudiante.js"

// ===== CRUD ESTUDIANTES =====

/**
 * Listar todos los estudiantes activos
 * GET /estudiantes
 */
const listarEstudiantes = async (req, res) => {
    try {
        const estudiantes = await Estudiante.find({ status: true }).select('-__v')
        
        if (estudiantes.length === 0) {
            return res.status(200).json({
                msg: "No hay estudiantes registrados",
                estudiantes: []
            })
        }
        
        res.status(200).json({
            msg: "Estudiantes listados correctamente",
            total: estudiantes.length,
            estudiantes
        })
    } catch (error) {
        console.error("Error al listar estudiantes:", error.message)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

/**
 * Obtener detalle de un estudiante específico
 * GET /estudiantes/:id
 */
const detalleEstudiante = async (req, res) => {
    try {
        const { id } = req.params
        
        // Validar que el ID sea un ObjectId válido de MongoDB
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                msg: "ID de estudiante inválido. Debe ser un ObjectId válido de MongoDB" 
            })
        }
        
        const estudiante = await Estudiante.findById(id).select('-__v')
        
        if (!estudiante) {
            return res.status(404).json({ 
                msg: "Estudiante no encontrado" 
            })
        }
        
        res.status(200).json({
            msg: "Estudiante encontrado",
            estudiante
        })
    } catch (error) {
        console.error("Error al obtener detalle del estudiante:", error.message)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

/**
 * Crear un nuevo estudiante
 * POST /estudiantes
 */
const crearEstudiante = async (req, res) => {
    try {
        const { nombre, apellido, cedula } = req.body

        // Validar campos obligatorios
        const camposObligatorios = ['nombre', 'apellido', 'cedula']
        const camposFaltantes = camposObligatorios.filter(campo => !req.body[campo])
        
        if (camposFaltantes.length > 0) {
            return res.status(400).json({
                msg: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}`
            })
        }

        // Validar que nombre y apellido sean strings no vacíos
        if (typeof nombre !== 'string' || nombre.trim() === '') {
            return res.status(400).json({
                msg: "El nombre debe ser un texto válido"
            })
        }

        if (typeof apellido !== 'string' || apellido.trim() === '') {
            return res.status(400).json({
                msg: "El apellido debe ser un texto válido"
            })
        }

        // Normalizar cédula (eliminar espacios y convertir a minúsculas)
        const cedulaNormalizada = cedula.toString().trim().toLowerCase()

        // Validar que la cédula no esté vacía después de normalizar
        if (cedulaNormalizada === '') {
            return res.status(400).json({
                msg: "La cédula no puede estar vacía"
            })
        }

        // Verificar si ya existe un estudiante con esta cédula
        const verificarCedula = await Estudiante.findOne({ cedula: cedulaNormalizada })

        if (verificarCedula) {
            return res.status(400).json({ 
                msg: "Ya existe un estudiante con esta cédula" 
            })
        }

        // Crear el nuevo estudiante con todos los campos del request
        const nuevoEstudiante = new Estudiante({
            ...req.body,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            cedula: cedulaNormalizada,
            status: true
        })

        // Guardar en la base de datos
        await nuevoEstudiante.save()

        // Respuesta de éxito
        res.status(201).json({
            msg: "Estudiante creado correctamente",
            estudiante: nuevoEstudiante
        })

    } catch (error) {
        console.error("Error al crear estudiante:", error.message)
        
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
                msg: `Ya existe un registro con este ${campo}` 
            })
        }

        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

/**
 * Actualizar un estudiante existente
 * PUT /estudiantes/:id
 */
const actualizarEstudiante = async (req, res) => {
    try {
        const { id } = req.params
        const actualizaciones = req.body

        // Validar que el ID sea válido
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                msg: "ID de estudiante inválido. Debe ser un ObjectId válido de MongoDB" 
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

        // Si se actualiza la cédula, validar que no exista otra con el mismo valor
        if (actualizaciones.cedula) {
            // Validar que la cédula sea un valor válido
            if (typeof actualizaciones.cedula === 'string' && actualizaciones.cedula.trim() === '') {
                return res.status(400).json({
                    msg: "La cédula no puede estar vacía"
                })
            }

            const cedulaNormalizada = actualizaciones.cedula.toString().trim().toLowerCase()
            const cedulaExistente = await Estudiante.findOne({ 
                cedula: cedulaNormalizada,
                _id: { $ne: id } // Excluir el estudiante actual
            })

            if (cedulaExistente) {
                return res.status(400).json({ 
                    msg: "Ya existe otro estudiante con esta cédula" 
                })
            }

            actualizaciones.cedula = cedulaNormalizada
        }

        // Normalizar nombre y apellido si se actualizan
        if (actualizaciones.nombre) {
            const nombreLimpio = actualizaciones.nombre.trim()
            if (nombreLimpio === '') {
                return res.status(400).json({
                    msg: "El nombre no puede estar vacío"
                })
            }
            actualizaciones.nombre = nombreLimpio
        }

        if (actualizaciones.apellido) {
            const apellidoLimpio = actualizaciones.apellido.trim()
            if (apellidoLimpio === '') {
                return res.status(400).json({
                    msg: "El apellido no puede estar vacío"
                })
            }
            actualizaciones.apellido = apellidoLimpio
        }

        const estudiante = await Estudiante.findByIdAndUpdate(
            id,
            actualizaciones,
            { new: true, runValidators: true }
        ).select('-__v')

        if (!estudiante) {
            return res.status(404).json({ 
                msg: "Estudiante no encontrado" 
            })
        }

        res.status(200).json({
            msg: "Estudiante actualizado correctamente",
            estudiante
        })

    } catch (error) {
        console.error("Error al actualizar estudiante:", error.message)
        
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
                msg: `Ya existe un registro con este ${campo}` 
            })
        }

        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}

/**
 * Eliminar (desactivar) un estudiante
 * DELETE /estudiantes/:id
 */
const eliminarEstudiante = async (req, res) => {
    try {
        const { id } = req.params

        // Validar que el ID sea válido
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                msg: "ID de estudiante inválido. Debe ser un ObjectId válido de MongoDB" 
            })
        }

        // Borrar físicamente de la BD
        const estudiante = await Estudiante.findByIdAndDelete(id).select('-__v')

        if (!estudiante) {
            return res.status(404).json({ 
                msg: "Estudiante no encontrado" 
            })
        }

        res.status(200).json({
            msg: "Estudiante eliminado correctamente",
            estudiante
        })

    } catch (error) {
        console.error("Error al eliminar estudiante:", error.message)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error.message}` })
    }
}


export {
    listarEstudiantes,
    detalleEstudiante,
    crearEstudiante,
    actualizarEstudiante,
    eliminarEstudiante
}