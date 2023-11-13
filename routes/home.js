const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');

let xssEnabled = false;

router.get('/', async (req, res) => {
    if (!req.session.user) {
        console.log('NOSESSION');
        return res.redirect('/');
    }

    try {
        // Fetch comments from the database
        const result = await pool.query(`
            SELECT Comments.comment_text, Users.email, Comments.created_at
            FROM Comments
            JOIN Users ON Comments.user_id = Users.user_id
            ORDER BY Comments.created_at DESC`);
        const comments = result.rows;

        res.render('home', {
            email: req.session.user.email,
            comments: comments,
            xssEnabled: xssEnabled,
            errorMessage: ''
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.redirect('/home');
    }
});

router.post('/comment', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const { commentText } = req.body;
    xssEnabled = !!req.body.xssEnabled;

    if (!commentText.trim()) {
        const result = await pool.query(`
            SELECT Comments.comment_text, Users.email, Comments.created_at
            FROM Comments
            JOIN Users ON Comments.user_id = Users.user_id
            ORDER BY Comments.created_at DESC`);
        const comments = result.rows;

        return res.render('home', {
            email: req.session.user.email,
            comments: comments,
            xssEnabled: xssEnabled,
            errorMessage: 'At least comment something...'
        });
    }

    try {
        // Insert new comment into the database
        if (commentText = '') {
            return res.render('home', { errorMessage: 'At least comment something...' });
        }
        await pool.query('INSERT INTO Comments (user_id, comment_text) VALUES ($1, $2)', 
                         [req.session.user.id, commentText]);

        res.redirect('/home');
    } catch (error) {
        console.error('Error posting comment:', error);
        res.redirect('/home');
    }
});

module.exports = router;