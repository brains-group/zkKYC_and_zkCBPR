const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./didDatabase.db');

// Create table if it doesn't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS dids (
        did TEXT PRIMARY KEY,
        realID TEXT UNIQUE
    )`);
});

