
const express = require('express');
const router = express.Router();

const { isAuthenticated, isAdmin } =
    require('../middleware/authMiddleware');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const db = req.app.locals.db;

        const [categories] = await db.execute(
            'SELECT * FROM categories ORDER BY category_name'
        );

        res.json(categories);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to load categories'
        });
    }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { category_name, description } = req.body;

        if (!category_name) {
            return res.status(400).json({
                message: 'Category name is required'
            });
        }

        const db = req.app.locals.db;

        await db.execute(
            'INSERT INTO categories (category_name, description) VALUES (?, ?)',
            [category_name, description || '']
        );

        res.status(201).json({
            message: 'Category added successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to add category'
        });
    }
});

module.exports = router;
