import express from 'express';
import multer from 'multer';
import pool from '../db.js';  
import findToken from '../middleware/authenticateToken.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, 
});


router.post('/upload', upload.single('resume'), async (req, res) => {
    try {
   
        console.log(req.body);
        console.log(req.file);
        
        const currentDateTime = new Date();

        const year = currentDateTime.getFullYear();
        const month = (currentDateTime.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDateTime.getDate().toString().padStart(2, '0');

        const hours = currentDateTime.getHours().toString().padStart(2, '0');
        const minutes = currentDateTime.getMinutes().toString().padStart(2, '0');
        const seconds = currentDateTime.getSeconds().toString().padStart(2, '0');

        const DATE = `${year}-${month}-${day}`;
        const TIME = `${hours}:${minutes}:${seconds}`;

        const { name, email } = req.body;
        const { buffer, mimetype, originalname } = req.file;

        console.log(buffer, mimetype, originalname);

        const sql = `
            INSERT INTO Users (name, email, date, time, resume_data, resume_contentType, resume_originalName)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [name, email, DATE, TIME, buffer, mimetype, originalname]);

        res.status(201).send({ response: 'User registered and resume uploaded successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error registering user and uploading resume' });
    }
});

// Get all users (admin only)
router.get('/admin/users', findToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, date, time FROM Users');

        res.status(200).json(users);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving users');
    }
});

// Download resume by user ID
router.get('/admin/download/:id', findToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT resume_data, resume_contentType, resume_originalName FROM Users WHERE id = ?', [req.params.id]);
        
        if (users.length === 0 || !users[0].resume_data) {
            return res.status(404).send('Resume not found');
        }

        const user = users[0];

        res.set({
            'Content-Type': user.resume_contentType,
            'Content-Disposition': `attachment; filename="${user.resume_originalName}"`,
        });

        res.status(200).send(user.resume_data);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error downloading resume');
    }
});

export default router;
