const express = require('express');
const cors = require('cors');
const { swaggerUi, swaggerDocument } = require('./swagger');

// Rutas del Controlador
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const tiendasRoutes = require('./routes/tiendas.routes');
const productosRoutes = require('./routes/productos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentación interactiva Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Endpoint informativo y de salud
app.get('/', (req, res) => {
  res.json({
    sistema: 'Stockearte - Controlador',
    version: '1.0.0',
    estado: 'Operativo',
    documentacion: `http://localhost:${PORT}/api/docs`,
    microservicios_grpc: {
      usuarios: process.env.USUARIOS_URL || 'localhost:50051',
      productos: process.env.PRODUCTOS_URL || 'localhost:50052',
      tiendas: process.env.TIENDAS_URL || 'localhost:50053'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Registro de rutas REST
app.use('/api/auth', authRoutes);
app.use('/api/login', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.get('/api/usuarios-disponibles', (req, res) => res.redirect('/api/usuarios/no-asignados'));
app.use('/api/tiendas', tiendasRoutes);
app.use('/api/productos', productosRoutes);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejo centralizado de errores (500)
app.use((err, req, res, next) => {
  console.error('[Controller Error Handler]', err);
  res.status(500).json({
    exito: false,
    mensaje: 'Error interno en el controlador',
    error: err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[INFO] Controlador Stockearte iniciado`);
  console.log(`[INFO] Servidor REST: http://localhost:${PORT}`);
  console.log(`[INFO] Documentación Swagger: http://localhost:${PORT}/api/docs`);
  console.log(`=======================================================`);
});

module.exports = app;
