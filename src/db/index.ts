import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
  connectionString: config.connectionString,
});

export const initDB = async () => {
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    email VARCHAR(35) UNIQUE NOT NULL ,
    password TEXT NOT NULL,
    role VARCHAR(15) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()

    )
    `);

    await pool.query(`
       CREATE TABLE IF NOT EXISTS issues(
       id SERIAL PRIMARY KEY,
       title VARCHAR(150) NOT NULL ,
       description TEXT NOT NULL CHECK (char_length(description) >= 20),
       type VARCHAR(17) NOT NULL CHECK (type IN ('bug' , 'feature_request')),
       status VARCHAR(15) DEFAULT 'open' CHECK (status IN ('open' , 'in_progress' , 'resolved')),
       reporter_id INT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
       ) 
        `);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};
