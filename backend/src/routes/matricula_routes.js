import { Router } from 'express'
import {
  listarMatriculas,
  detalleMatricula,
  crearMatricula,
  actualizarMatricula,
  agregarMateria,
  eliminarMateria,
  eliminarMatricula
} from '../controllers/matricula_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'

const router = Router()

router.get('/',    verificarTokenJWT, listarMatriculas)
router.get('/:id', verificarTokenJWT, detalleMatricula)
router.post('/',   verificarTokenJWT, crearMatricula)
router.put('/:id', verificarTokenJWT, actualizarMatricula)
router.post('/:id/materias',              verificarTokenJWT, agregarMateria)
router.delete('/:id/materias/:idMateria', verificarTokenJWT, eliminarMateria)
router.delete('/:id',                     verificarTokenJWT, eliminarMatricula)

export default router
