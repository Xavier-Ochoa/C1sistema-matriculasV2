import { Router } from 'express';
import { 
  registro, 
  login, 
  perfil
} from '../controllers/auth_controller.js';
import { verificarTokenJWT } from '../middlewares/JWT.js';

const router = Router();

// ===== RUTAS PÚBLICAS - AUTENTICACIÓN =====

router.post('/registro', registro);
router.post('/login', login);

// ===== RUTAS PROTEGIDAS =====

router.get('/perfil', verificarTokenJWT, perfil);

export default router;
