
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const { isAuthenticated } =
    require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + '-' +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const allowedExtensions = [
    '.pdf', '.doc', '.docx', '.txt',
    '.png', '.jpg', '.jpeg'
];

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'));
        }
    }
});

router.post(
    '/upload',
    isAuthenticated,
    (req, res, next) => {
        upload.single('document')(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    message: err.message
                });
            }

            next();
        });
    },
    async (req, res) => {
        try {
            const { title, category_id } = req.body;

            if (!req.file || !title || !category_id) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message: 'Title, category and file are required'
                });
            }

            const db = req.app.locals.db;

            const [categories] = await db.execute(
                'SELECT category_id FROM categories WHERE category_id = ?',
                [category_id]
            );

            if (categories.length === 0) {
                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    message: 'Invalid category'
                });
            }

            await db.execute(
                `INSERT INTO documents
                (user_id, category_id, title, file_name, file_path)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    req.session.user.user_id,
                    category_id,
                    title,
                    req.file.originalname,
                    req.file.filename
                ]
            );

            res.status(201).json({
                message: 'Document uploaded successfully'
            });

        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            console.error(error);

            res.status(500).json({
                message: 'Document upload failed'
            });
        }
    }
);

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = req.session.user.user_id;
        const search = req.query.search || '';

        const [documents] = await db.execute(
            `SELECT DISTINCT
                d.document_id,
                d.user_id,
                d.category_id,
                d.title,
                d.file_name,
                d.upload_date,
                d.status,
                c.category_name,
                u.name AS uploader
             FROM documents d
             JOIN categories c ON d.category_id = c.category_id
             JOIN users u ON d.user_id = u.user_id
             LEFT JOIN document_access a
                ON d.document_id = a.document_id
             WHERE
                (d.user_id = ?
                OR a.user_id = ?)
                AND d.title LIKE ?
             ORDER BY d.upload_date DESC`,
            [userId, userId, `%${search}%`]
        );

        res.json(documents);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Failed to load documents'
        });
    }
});

router.get('/download/:id', isAuthenticated, async (req, res) => {
    try {
        const db = req.app.locals.db;

        const userId = req.session.user.user_id;
        const documentId = req.params.id;

        const [documents] = await db.execute(
            `SELECT d.*
             FROM documents d
             LEFT JOIN document_access a
                ON d.document_id = a.document_id
             WHERE d.document_id = ?
             AND (d.user_id = ?
             OR (a.user_id = ?
             AND a.permission IN ('View', 'Download', 'Edit')))`,
            [documentId, userId, userId]
        );

        if (documents.length === 0) {
            return res.status(403).json({
                message: 'You do not have access to this document'
            });
        }

        const document = documents[0];

        const filePath = path.join(uploadDir, document.file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: 'File not found'
            });
        }

        res.download(filePath, document.file_name);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Download failed'
        });
    }
});

router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = req.session.user.user_id;
        const documentId = req.params.id;

        const [documents] = await db.execute(
            'SELECT * FROM documents WHERE document_id = ? AND user_id = ?',
            [documentId, userId]
        );

        if (documents.length === 0) {
            return res.status(403).json({
                message: 'Only the document owner can delete it'
            });
        }

        const document = documents[0];

        await db.execute(
            'DELETE FROM documents WHERE document_id = ?',
            [documentId]
        );

        const filePath = path.join(uploadDir, document.file_path);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Delete failed'
        });
    }
});

module.exports = router;
