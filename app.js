const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const path = require('path');
const createError = require('http-errors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const morgan = require('morgan');
const dotenv = require('dotenv');
const { pool } = require('./database/db');

//console.log(require.resolve('./database/db'));
const { createTables } = require('./database/db');
const { clearDatabase } = require('./database/db');
const { displayAllTables } = require('./database/db');

dotenv.config();
app.use(morgan('dev'));

// For Render deploy
const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 3000;
const config = {
    secret: process.env.SECRET,
    baseURL: externalUrl || `https://localhost:${port}`
};

app.use(session({
    store: new pgSession({
        pool: pool, // Connection pool
        tableName: 'session' // Use another table name if you prefer
    }),
    secret: process.env.SESSION_SECRET || 'default_secret_key',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Set to true if production
        httpOnly: true // Prevents client-side JS from accessing the cookie
    }
}));

async function initializeDatabase() {
    try {
        //await clearDatabase();
        await createTables();
        //await displayAllTables();
    } catch (error) {
        console.error('Error during database initialization:', error);
    }
}

initializeDatabase();

const indexRouter = require('./routes/index');
const loginRouter = require('./routes/login');
const signupRouter = require('./routes/signup');
const homeRouter = require('./routes/home');
const logoutRouter = require('./routes/logout');
const changePasswordRouter = require('./routes/change');

// Body content parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set the view engine to ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static files
app.use(express.static('public'));

// Routes
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/signup', signupRouter);
app.use('/home', homeRouter);
app.use('/logout', logoutRouter);
app.use('/change',changePasswordRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});
  
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


// put in package.json in development "start": "nodemon app.js --ext js,ejs" instead of  "build": "npm run clean","clean": "rm -rf dist","start": "node server.js"
if (externalUrl) {
    const hostname = '0.0.0.0'; // ne 127.0.0.1
    app.listen(port, hostname, () => {
        console.log(`Server locally running at http://${hostname}:${port}/ and from outside on ${externalUrl}`);
    });
  }
  else {
    https.createServer({
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert')
    }, app)
    .listen(port, () => {
        console.log(`Server running at https://localhost:${port}/`);
    });
  }