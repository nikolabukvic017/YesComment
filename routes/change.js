const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { pool } = require('../database/db');

const saltRounds = 10; // Used for bcrypt password hashing

function validatePassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumbers && isLongEnough;
}

// Route to render the change password page
router.get('/', async (req, res) => {
    const userId = req.session.user?.id;

     // If not logged in, redirect to login
    if (!userId) {
        return res.redirect('/login');
    }

    try {
        const userResult = await pool.query('SELECT password FROM Users WHERE user_id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.redirect('/login');
        }

        // Fetch the current password
        const currentPassword = userResult.rows[0].password;

        res.render('change', { 
            errorMessage: '',
            currentPassword: currentPassword // Pass the current password to the template
        });
    } catch (error) {
        console.error('Error fetching user password:', error);
        res.redirect('/login');
    }
});

// Route to handle change password form submission
router.post('/', async (req, res) => {
    const { currentPassword, newPassword, sensitiveData } = req.body;
    const userId = req.session.user?.id;

    if (!userId) {
        return res.redirect('/login'); // Not logged in, redirect to login
    }

    try {
        const userResult = await pool.query('SELECT * FROM Users WHERE user_id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.redirect('/login');
        }

        const user = userResult.rows[0];
        const isPasswordValid = !user.password.startsWith("$2b$") ? 
                                currentPassword === user.password : 
                                await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.render('change', {
                errorMessage: 'Current password is incorrect.',
                currentPassword: currentPassword
            });
        }

        if (!sensitiveData && !validatePassword(newPassword)) {
            return res.render('change', {
                errorMessage: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number.',
                currentPassword: currentPassword
            });
        }

        if (currentPassword === newPassword) {
            return res.render('change', {
                errorMessage: 'New password cannot be the same as the current password.',
                currentPassword: currentPassword
            });
        }

        const updatedPassword = sensitiveData ? newPassword : await bcrypt.hash(newPassword, saltRounds);
        await pool.query('UPDATE Users SET password = $1 WHERE user_id = $2', [updatedPassword, userId]);

        res.redirect('/home');
    } catch (error) {
        console.error('Change password error:', error);
        res.redirect('/change');
    }
});

module.exports = router;
