import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Definimos el esquema para el modelo de Usuario
const usuarioSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    apellido: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    rol: {
      type: String,
      enum: ['admin', 'usuario'],
      default: 'usuario',
    },
    status: {
      type: Boolean,
      default: true,
    },
    token: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Método para cifrar el password
usuarioSchema.methods.encryptPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  const passwordEncryp = await bcrypt.hash(password, salt);
  return passwordEncryp;
};

// Método para verificar si el password es el mismo de la BDD
usuarioSchema.methods.matchPassword = async function (password) {
  const response = await bcrypt.compare(password, this.password);
  return response;
};

// Método para crear un token
usuarioSchema.methods.createToken = function () {
  const tokenGenerado = Math.random().toString(36).slice(2);
  this.token = tokenGenerado;
  return tokenGenerado;
};

// Exportamos el modelo con el nombre 'Usuario'
export default model('Usuario', usuarioSchema);
