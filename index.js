// const express = require('express');
// const app = express();
// const port = 3000;

// // Middleware para parsear JSON
// app.use(express.json());

// const mysql = require('mysql2/promise');

// // Crea una pool de conexiones con la información de tu base de datos
// const pool = mysql.createPool({
//     host: 'test-db-merida.c0oen9i4myoj.us-east-2.rds.amazonaws.com',
//     user: 'admin',
//     password: 'merida-12345',
//     database: 'example-merida'
// });

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });

// app.get("/usuarios", (req, res) => {
//     pool.query('SELECT * FROM usuarios')
//         .then(([rows, fields]) => {
//             res.json(rows);
//         })
//         .catch(err => {
//             console.error('Error executing query', err);
//             res.status(500).send('Error retrieving users');
//         });
// })

// // Endpoint POST para crear un usuario
// app.post("/usuarios", (req, res) => {
//     const { nombre, email, telefono, edad } = req.body;

//     // Validación básica
//     if (!nombre || !email) {
//         return res.status(400).json({
//             error: 'Los campos nombre y email son obligatorios'
//         });
//     }

//     // Validar formato de email básico
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//         return res.status(400).json({
//             error: 'Formato de email inválido'
//         });
//     }

//     const query = 'INSERT INTO usuarios (nombre, email, telefono, edad) VALUES (?, ?, ?, ?)';

//     pool.query(query, [nombre, email, telefono || null, edad || null])
//         .then(([result]) => {
//             res.status(201).json({
//                 message: 'Usuario creado exitosamente',
//                 id: result.insertId,
//                 usuario: {
//                     id: result.insertId,
//                     nombre,
//                     email,
//                     telefono,
//                     edad
//                 }
//             });
//         })
//         .catch(err => {
//             console.error('Error creating user', err);

//             // Manejar error de email duplicado (si existe constraint UNIQUE)
//             if (err.code === 'ER_DUP_ENTRY') {
//                 return res.status(409).json({
//                     error: 'El email ya está registrado'
//                 });
//             }

//             res.status(500).json({
//                 error: 'Error interno del servidor al crear el usuario'
//             });
//         });
// });

// app.listen(port, () => {
//     console.log(`App listening at http://localhost:${port}`);
// });

import express from "express";
import dotenv from "dotenv";
import pool, { testConnection } from "./connection.js";

dotenv.config();
const app = express();
app.use(express.json());

// Probar conexión a la base de datos
testConnection();

// ✅ GET todos los productos
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET producto por ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST crear producto
app.post("/api/products", async (req, res) => {
  const { name, description, price, stock, image } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO products (name, description, price, stock, image, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [name, description, price, stock, image]
    );
    res.status(201).json({ id: result.insertId, message: "Producto creado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT actualizar producto
app.put("/api/products/:id", async (req, res) => {
  const { name, description, price, stock, image } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, stock = ?, image = ? 
       WHERE id = ?`,
      [name, description, price, stock, image, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE eliminar producto
app.delete("/api/products/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
