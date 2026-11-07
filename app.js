
const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

app.locals.db = pool;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/access', require('./routes/access'));

app.get('/api/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            message: 'Please login first'
        });
    }

    res.json(req.session.user);
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: 'Logged out successfully' });
    });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await pool.query('SELECT 1');
        console.log('MySQL connected successfully');

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
}

startServer();
