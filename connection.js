import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS currentTime");
    console.log("✅ Conexión exitosa a la base de datos:", rows[0].currentTime);
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error.message);
  }
};

export default pool;
