import jwt from "jsonwebtoken"
import Usuario from "../models/Usuario.js"

/**
 * Crear token JWT
 * @param {string} id - ID del usuario
 * @param {string} rol - Rol del usuario
 * @returns {string} token - JWT
 */
const crearTokenJWT = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

/**
 * Verificar token JWT para rutas protegidas
 */
const verificarTokenJWT = async (req, res, next) => {
    const { authorization } = req.headers
    
    if (!authorization) {
        return res.status(401).json({ msg: "Acceso denegado: token no proporcionado" })
    }
    
    try {
        const token = authorization.split(" ")[1]
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET)
        
        // Buscar al usuario en la base de datos
        const usuarioBDD = await Usuario.findById(id).lean().select("-password")
        
        if (!usuarioBDD) {
            return res.status(401).json({ msg: "Usuario no encontrado" })
        }
        
        // Agregar información del usuario a la request
        req.usuarioHeader = usuarioBDD
        req.usuarioBDD = usuarioBDD
        
        next()
        
    } catch (error) {
        console.log(error)
        return res.status(401).json({ msg: `Token inválido o expirado - ${error.message}` })
    }
}

export { 
    crearTokenJWT,
    verificarTokenJWT
}
