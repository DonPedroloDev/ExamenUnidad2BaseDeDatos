import express from "express";
import dotenv from "dotenv";
import pool, { testConnection } from "./connection.js";
import purchasesRoutes from "./routes/purchases.js"; // 👈 importa las rutas

dotenv.config();
const app = express();
app.use(express.json());

// Probar conexión a la base de datos
testConnection();

// Obtener todos los productos
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener producto por ID
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

// Crear producto
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

// Actualizar producto
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

// Eliminar producto
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

// rutas de compras
app.use(purchasesRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
