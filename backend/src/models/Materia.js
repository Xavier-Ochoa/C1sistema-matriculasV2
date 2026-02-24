import { Schema, model } from 'mongoose';

// Definimos el esquema para el modelo de Materia
const materiaSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    codigo: {
      type: String,
      required: [true, 'El código es obligatorio'],
      trim: true,
      unique: [true, 'Ya existe una materia con este código'],
    },
    descripcion: {
      type: String,
      trim: true,
      default: null,
    },
    creditos: {
      type: Number,
      required: [true, 'Los créditos son obligatorios'],
      min: [0, 'Los créditos no pueden ser negativos'],
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

// Exportamos el modelo con el nombre 'Materia'
export default model('Materia', materiaSchema);