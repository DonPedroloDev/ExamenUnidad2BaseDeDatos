import express from "express";
import pool from "../connection.js";

const router = express.Router();
// Obtener Compras
router.get("/api/purchases", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name AS user_name
      FROM purchases p
      JOIN users u ON p.user_id = u.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener compra por ID (con detalles)
router.get("/api/purchases/:id", async (req, res) => {
  try {
    const [purchaseRows] = await pool.query(
      "SELECT * FROM purchases WHERE id = ?",
      [req.params.id]
    );
    if (purchaseRows.length === 0)
      return res.status(404).json({ message: "Compra no encontrada" });

    const [details] = await pool.query(
      `
      SELECT pd.*, pr.name AS product_name
      FROM purchase_details pd
      JOIN products pr ON pd.product_id = pr.id
      WHERE pd.purchase_id = ?
    `,
      [req.params.id]
    );

    res.json({ ...purchaseRows[0], details });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear compra
router.post("/api/purchases", async (req, res) => {
  const { user_id, products, status } = req.body;

  // Validaciones iniciales
  if (!user_id || !products || !Array.isArray(products))
    return res.status(400).json({ message: "Datos inválidos" });

  if (products.length === 0)
    return res.status(400).json({ message: "Debe haber al menos un producto" });

  if (products.length > 5)
    return res
      .status(400)
      .json({ message: "No se pueden agregar más de 5 productos" });

  // Validar status
  let finalStatus = "COMPLETADA"; // valor por defecto
  if (status) {
    const validStatuses = ["PENDIENTE", "COMPLETADA"];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        message: "Estatus inválido. Debe ser 'PENDIENTE' o 'COMPLETADA'",
      });
    }
    finalStatus = status.toUpperCase();
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    let total = 0;

    // Validar stock y calcular total
    for (const item of products) {
      const [rows] = await connection.query(
        "SELECT price, stock FROM products WHERE id = ?",
        [item.product_id]
      );
      if (rows.length === 0)
        throw new Error(`Producto con id ${item.product_id} no existe`);

      const product = rows[0];
      if (product.stock < item.quantity)
        throw new Error(
          `Stock insuficiente para el producto ${item.product_id}`
        );

      total += product.price * item.quantity;
    }

    if (total > 3500)
      throw new Error("El total de la compra no puede exceder $3500");

    // Insertar compra
    const [result] = await connection.query(
      "INSERT INTO purchases (user_id, total, status, purchase_date) VALUES (?, ?, ?, NOW())",
      [user_id, total, finalStatus]
    );
    const purchaseId = result.insertId;

    // Insertar detalles y descontar stock
    for (const item of products) {
      const [prodData] = await connection.query(
        "SELECT price FROM products WHERE id = ?",
        [item.product_id]
      );
      const price = prodData[0].price;
      const subtotal = price * item.quantity;

      await connection.query(
        `
        INSERT INTO purchase_details (purchase_id, product_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?)`,
        [purchaseId, item.product_id, item.quantity, price, subtotal]
      );

      await connection.query(
        `
        UPDATE products SET stock = stock - ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: "Compra creada",
      purchase_id: purchaseId,
      status: finalStatus,
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Actualizar compra
router.put("/api/purchases/:id", async (req, res) => {
  const { status } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE purchases SET status = ? WHERE id = ?",
      [status, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Compra no encontrada" });
    res.json({ message: "Compra actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar compra
router.delete("/api/purchases/:id", async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar si existe
    const [purchase] = await connection.query(
      "SELECT status FROM purchases WHERE id = ?",
      [req.params.id]
    );

    if (purchase.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    // Validar si está completada
    if (purchase[0].status === "COMPLETADA") {
      await connection.rollback();
      return res.status(400).json({
        message: "No se pueden eliminar compras con estatus COMPLETADA",
      });
    }

    // Revertir stock antes de eliminar
    const [details] = await connection.query(
      "SELECT product_id, quantity FROM purchase_details WHERE purchase_id = ?",
      [req.params.id]
    );

    for (const d of details) {
      await connection.query(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [d.quantity, d.product_id]
      );
    }

    // Eliminar detalles y compra
    await connection.query(
      "DELETE FROM purchase_details WHERE purchase_id = ?",
      [req.params.id]
    );
    await connection.query("DELETE FROM purchases WHERE id = ?", [
      req.params.id,
    ]);

    await connection.commit();
    res.json({ message: "Compra eliminada y stock restaurado" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});
export default router;
