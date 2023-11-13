const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { pool } = require('../database/db');

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
}

router.get('/', (req, res) => {
    res.render('login', { errorMessage: '' });
});

router.post('/', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if (!validateEmail(email)) {
            return res.render('signup', { errorMessage: 'Invalid email format.' });
        }

        // Retrieve the user from the database
        const userResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            // User not found
            return res.render('login', { errorMessage: 'Invalid email or password.' });
        }

        const user = userResult.rows[0];

        // Check if the stored password is hashed
        const isPasswordHashed = user.password.startsWith("$2b$");

        // Compare the provided password with the stored password
        let isValidPassword;
        if (isPasswordHashed) {
            isValidPassword = await bcrypt.compare(password, user.password);
        } else {
            isValidPassword = (password === user.password);
        }

        if (!isValidPassword) {
            return res.render('login', { errorMessage: 'Invalid email or password.' });
        }

        req.session.user = { 
            id: user.user_id, 
            email: user.email
        };

        console.log('Me here');
        res.redirect('/home');
    } catch (error) {
        console.log('me not here');
        console.error('Login error:', error);
        res.redirect('/login'); // Redirect back or handle the error as needed
    }
});

module.exports = router;
