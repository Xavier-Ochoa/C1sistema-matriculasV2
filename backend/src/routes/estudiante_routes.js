import { Router } from 'express';
import {
  listarEstudiantes,
  detalleEstudiante,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante
} from '../controllers/estudiante_controller.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';

const router = Router();

// ===== RUTAS PROTEGIDAS - CRUD ESTUDIANTES =====

// Listar todos los estudiantes
router.get('/', verificarTokenJWT, listarEstudiantes);

// Obtener detalle de un estudiante
router.get('/:id', verificarTokenJWT, detalleEstudiante);

// Crear un nuevo estudiante
router.post('/', verificarTokenJWT, crearEstudiante);

// Actualizar un estudiante
router.put('/:id', verificarTokenJWT, actualizarEstudiante);

// Eliminar un estudiante (soft delete)
router.delete('/:id', verificarTokenJWT, eliminarEstudiante);

export default router;
