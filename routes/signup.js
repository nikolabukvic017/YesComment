const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { pool } = require('../database/db');

const saltRounds = 10; // Used for bcrypt password hashing

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
}

function validatePassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumbers && isLongEnough;
}

// Route to render the signup page
router.get('/', (req, res) => {
    res.render('signup', { errorMessage: '' });
});

// Route to handle signup form submission
router.post('/', async (req, res) => {
    const { email, password, sensitiveData } = req.body;

    try {
        if (!validateEmail(email)) {
            return res.render('signup', { errorMessage: 'Invalid email format.' });
        }

        // Check if the user already exists in the database
        const userExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            console.log("HEY WEB BUDDY, SOMETHING IS WRONG WITH THIS LINE UNDER THIS ONE");
            return res.render('signup', {errorMessage: 'User already exists'}); // Redirect back or show an error message
        }

        // Validate password complexity
        if (!sensitiveData && !validatePassword(password)) {
            return res.render('signup', { errorMessage: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number.' });
        }

        // Encrypt the password if sensitiveData is not checked
        const storedPassword = sensitiveData ? password : await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        const newUser = await pool.query('INSERT INTO Users (email, password) VALUES ($1, $2) RETURNING user_id', [email, storedPassword]);

        req.session.user = {
            id: newUser.rows[0].user_id,
            email: email
        };
        res.redirect('/home');
    } catch (error) {
        console.error('Signup error:', error);
        res.render('signup', { errorMessage: 'An error occurred. Please try again.' });
    }
});

module.exports = router;