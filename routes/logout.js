const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error during session destruction:', err);
            return res.redirect('/home');
        }

        res.redirect('/login');
    });
});

module.exports = router;
