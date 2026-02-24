import { Schema, model } from 'mongoose';

// Definimos el esquema para el modelo de Estudiante
const estudianteSchema = new Schema(
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
    cedula: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fecha_nacimiento: {
      type: String,
      trim: true,
      default: null,
    },
    ciudad: {
      type: String,
      trim: true,
      default: null,
    },
    direccion: {
      type: String,
      trim: true,
      default: null,
    },
    telefono: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Exportamos el modelo con el nombre 'Estudiante'
export default model('Estudiante', estudianteSchema);
