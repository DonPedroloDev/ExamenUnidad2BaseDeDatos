import express from "express";
import pool from "../connection.js";

const router = express.Router();

// Obtener todos los productos
router.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener producto por ID
router.get("/api/products/:id", async (req, res) => {
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

// Crear producto
router.post("/api/products", async (req, res) => {
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

// Actualizar producto
router.put("/api/products/:id", async (req, res) => {
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

// Eliminar producto
router.delete("/api/products/:id", async (req, res) => {
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

export default router;
