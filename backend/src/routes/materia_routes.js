import { Router } from 'express';
import {
  listarMaterias,
  detalleMateria,
  crearMateria,
  actualizarMateria,
  eliminarMateria
} from '../controllers/materia_controller.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';

const router = Router();

// ===== RUTAS PROTEGIDAS - CRUD MATERIAS =====

// Listar todas las materias
router.get('/', verificarTokenJWT, listarMaterias);

// Obtener detalle de una materia
router.get('/:id', verificarTokenJWT, detalleMateria);

// Crear una nueva materia
router.post('/', verificarTokenJWT, crearMateria);

// Actualizar una materia
router.put('/codigo/:codigo', verificarTokenJWT, actualizarMateria);

// Eliminar una materia (soft delete)
router.delete('/codigo/:codigo', verificarTokenJWT, eliminarMateria);

export default router;
