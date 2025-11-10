import express from "express";
import dotenv from "dotenv";
import pool, { testConnection } from "./connection.js";
import purchasesRoutes from "./routes/purchases.js";
import productsRoutes from "./routes/products.js";

dotenv.config();
const app = express();
app.use(express.json());

// Probar conexión a la base de datos
testConnection();

// rutas de prodcutos
app.use(productsRoutes);

// rutas de compras
app.use(purchasesRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
