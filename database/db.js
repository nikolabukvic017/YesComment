const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
    ssl: true // true for production, false for development (render database)
});

// Clear the database
const clearDatabase = async () => {
  try {
      // Delete data from the 'comments' table first to avoid foreign key constraints issues
      await pool.query('DELETE FROM Comments;');
      // Then delete data from the 'users' table
      await pool.query('DELETE FROM Users;');
      // Clear the 'session' table
      await pool.query('DELETE FROM session;');
      
      // Reset the auto-incrementing IDs for both 'Users' and 'Comments' tables
      await pool.query('ALTER SEQUENCE Users_user_id_seq RESTART WITH 1;');
      await pool.query('ALTER SEQUENCE Comments_comment_id_seq RESTART WITH 1;');
      
      console.log('The database has been cleared.');
  } catch (error) {
      console.error('Error while clearing data from the database:', error);
  }
};

// Function to display all data from tables for debugging
async function displayAllTables() {
  try {
      const userResults = await pool.query("SELECT * FROM Users");
      console.log("Content of table Users:", userResults.rows);
    
      const commentResults = await pool.query("SELECT * FROM Comments");
      console.log("Content of table Comments:", commentResults.rows);

      const sessionResults = await pool.query("SELECT * FROM session");
      console.log("Content of table session:", sessionResults.rows);
    
  } catch (error) {
      console.error("Error while retrieving data from tables:", error);
  }
}

// Create the database
const createTables = async () => {
    try {
      // Create the 'users' table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS Users (
          user_id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        );
      `);
      console.log('Table "Users" has been successfully created or updated!');

      // Create the 'comments' table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS Comments (
          comment_id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES Users(user_id),
          comment_text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Table "Comments" has been successfully created or updated!');

      // Create the 'session' table
      await pool.query(`
            CREATE TABLE IF NOT EXISTS "session" (
                "sid" varchar NOT NULL COLLATE "default",
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL,
                PRIMARY KEY ("sid")
            )
            WITH (OIDS=FALSE);
      `);
      console.log('Table "session" has been successfully created or updated!');
    } catch (error) {
      console.error('Error while creating or updating tables:', error);
    }
};


module.exports = {
    pool,
    clearDatabase,
    displayAllTables,
    createTables
};
