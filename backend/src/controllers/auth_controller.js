import Usuario from "../models/Usuario.js"
import { crearTokenJWT } from "../middlewares/JWT.js"

// ===== AUTENTICACIÓN =====

const registro = async (req, res) => {
    try {
        const { email, password, nombre, apellido } = req.body;
        
        // Validar campos obligatorios
        const camposObligatorios = ['email', 'password', 'nombre', 'apellido'];
        const camposFaltantes = camposObligatorios.filter(campo => !req.body[campo]);
        
        if (camposFaltantes.length > 0) {
            return res.status(400).json({
                msg: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}`
            });
        }
        
        const verificarEmailBDD = await Usuario.findOne({email});
        if(verificarEmailBDD) {
            return res.status(400).json({msg: "Lo sentimos, el email ya se encuentra registrado"});
        }
        
        const nuevoUsuario = new Usuario(req.body);
        nuevoUsuario.password = await nuevoUsuario.encryptPassword(password);
        nuevoUsuario.token = nuevoUsuario.createToken();
        
        await nuevoUsuario.save();
        
        res.status(201).json({
            msg: "Usuario registrado correctamente",
            usuario: {
                _id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                apellido: nuevoUsuario.apellido,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol,
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            msg: `Error en el servidor: ${error.message}`
        });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Verifica que todos los campos estén llenos
        if (Object.values(req.body).includes("")) 
            return res.status(404).json({ msg: "Debes llenar todos los campos" })

        // Busca al usuario por email
        const usuarioBDD = await Usuario.findOne({ email })
            .select("-status -__v -token -updatedAt -createdAt")
        if (!usuarioBDD) 
            return res.status(404).json({ msg: "El usuario no se encuentra registrado" })

        // Verifica la contraseña
        const verificarPassword = await usuarioBDD.matchPassword(password)
        if (!verificarPassword) 
            return res.status(401).json({ msg:"Lo sentimos, el password no es el correcto" })

        // Extrae los datos necesarios
        const { nombre, apellido, _id, rol } = usuarioBDD

        // Crea el token JWT
        const token = crearTokenJWT(_id, rol)

        // Devuelve token + datos del usuario
        res.status(200).json({
            token,
            rol,
            nombre,
            apellido,
            _id,
            email: usuarioBDD.email
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: `❌ Error en el servidor - ${error}` })
    }
}

const perfil = (req, res) => {
    res.status(200).json({
        msg: "Perfil del usuario",
        usuario: req.usuarioBDD
    })
}

export { 
    registro,
    login,
    perfil
}
