import { Router } from 'express';
import * as usetController from '../controllers/user.controller.js';
import { body } from 'express-validator';


const router = Router();



router.post('/register',
    body('email').isEmail().withMessage('Email must be a valid email adress'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    usetController.createUserController);

export default router;