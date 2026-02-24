import { Schema, model } from 'mongoose';

// Modelo de Matrícula con vinculación clara
const matriculaSchema = new Schema(
  {
    id_estudiante: {
      type: Schema.Types.ObjectId,
      ref: 'Estudiante',  // Vinculación con colección Estudiante
      required: [true, 'El ID del estudiante es obligatorio'],
      unique: true,
    },
    codigo: {
      type: String,
      required: [true, 'El código de matrícula es obligatorio'],
      unique: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: null,
    },
    materias: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Materia',  // Vinculación con colección Materia
      },
    ],
    creditosCalculados: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default model('Matricula', matriculaSchema);