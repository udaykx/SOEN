import projectModel from '../models/project.model.js';
import * as projectService from '../services/project.service.js';
import userModel from '../models/user.model.js';
import { validationResult } from 'express-validator';

export const createProject = async (req, res) => {
    
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
    const { name } = req.body;
    const loggedInUserId = await userModel.findOne({ email: req.user.email }).select('_id');
    const userId = loggedInUserId._id;

    const newProject = await projectService.createProject({ name, userId });

    res.status(201).json(newProject);

    } catch (err) {
        console.log(err);
        res.status(400).send( err.message );
    }
}