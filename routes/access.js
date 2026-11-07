
const express = require('express');
const router = express.Router();

const { isAuthenticated } =
    require('../middleware/authMiddleware');

router.get('/:documentId', isAuthenticated, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = req.session.user.user_id;
        const documentId = req.params.documentId;

        const [documents] = await db.execute(
            'SELECT document_id FROM documents WHERE document_id = ? AND user_id = ?',
            [documentId, userId]
        );

        if (documents.length === 0) {
            return res.status(403).json({
                message: 'Only the owner can manage access'
            });
        }

        const [access] = await db.execute(
            `SELECT a.access_id, a.user_id, u.name, u.email,
                    a.permission, a.granted_date
             FROM document_access a
             JOIN users u ON a.user_id = u.user_id
             WHERE a.document_id = ?`,
            [documentId]
        );

        res.json(access);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to load access list'
        });
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { document_id, email, permission } = req.body;

        const db = req.app.locals.db;
        const ownerId = req.session.user.user_id;

        const validPermissions = ['View', 'Download', 'Edit'];

        if (!validPermissions.includes(permission)) {
            return res.status(400).json({
                message: 'Invalid permission'
            });
        }

        const [documents] = await db.execute(
            'SELECT document_id FROM documents WHERE document_id = ? AND user_id = ?',
            [document_id, ownerId]
        );

        if (documents.length === 0) {
            return res.status(403).json({
                message: 'Only the owner can share this document'
            });
        }

        const [users] = await db.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found. Ask them to register first.'
            });
        }

        const targetUserId = users[0].user_id;

        if (targetUserId === ownerId) {
            return res.status(400).json({
                message: 'You already own this document'
            });
        }

        await db.execute(
            `INSERT INTO document_access
            (document_id, user_id, permission)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE permission = ?`,
            [document_id, targetUserId, permission, permission]
        );

        res.json({
            message: 'Document access granted successfully'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Failed to grant access'
        });
    }
});

router.delete('/:accessId', isAuthenticated, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const ownerId = req.session.user.user_id;
        const accessId = req.params.accessId;

        const [access] = await db.execute(
            `SELECT a.access_id
             FROM document_access a
             JOIN documents d ON a.document_id = d.document_id
             WHERE a.access_id = ? AND d.user_id = ?`,
            [accessId, ownerId]
        );

        if (access.length === 0) {
            return res.status(403).json({
                message: 'Access record not found'
            });
        }

        await db.execute(
            'DELETE FROM document_access WHERE access_id = ?',
            [accessId]
        );

        res.json({
            message: 'Document access revoked'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to revoke access'
        });
    }
});

module.exports = router;
