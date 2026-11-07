
const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must contain at least 6 characters'
            });
        }

        const db = req.app.locals.db;

        const [existing] = await db.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'user']
        );

        res.status(201).json({
            message: 'Registration successful'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Registration failed'
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const db = req.app.locals.db;

        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({
                    message: 'Session error'
                });
            }

            req.session.user = {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            res.json({
                message: 'Login successful',
                user: req.session.user
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Login failed'
        });
    }
});

module.exports = router;
