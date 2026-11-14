const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const options = {
  keepCase: true,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true
};

const PROTO_DIR = path.resolve(__dirname, '../../proto');

// 1. Cargar definiciones proto
const usuarioPkgDef = protoLoader.loadSync(path.join(PROTO_DIR, 'usuario.proto'), options);
const tiendaPkgDef = protoLoader.loadSync(path.join(PROTO_DIR, 'tienda.proto'), options);
const productoPkgDef = protoLoader.loadSync(path.join(PROTO_DIR, 'producto.proto'), options);

const usuarioProto = grpc.loadPackageDefinition(usuarioPkgDef).stockearte.usuario;
const tiendaProto = grpc.loadPackageDefinition(tiendaPkgDef).stockearte.tienda;
const productoProto = grpc.loadPackageDefinition(productoPkgDef).stockearte.producto;

// 2. Puertos y direcciones según configuración
const USUARIOS_URL = process.env.USUARIOS_URL || 'localhost:50051';
const PRODUCTOS_URL = process.env.PRODUCTOS_URL || 'localhost:50052';
const TIENDAS_URL = process.env.TIENDAS_URL || 'localhost:50053';

// 3. Instanciar clientes gRPC
const rawUsuariosClient = new usuarioProto.UsuariosService(
  USUARIOS_URL,
  grpc.credentials.createInsecure()
);

const rawProductosClient = new productoProto.ProductosService(
  PRODUCTOS_URL,
  grpc.credentials.createInsecure()
);

const rawTiendasClient = new tiendaProto.TiendasService(
  TIENDAS_URL,
  grpc.credentials.createInsecure()
);

// 4. Helper para promisificar llamadas gRPC
function promisify(client, methodName) {
  return function (request = {}) {
    return new Promise((resolve, reject) => {
      client[methodName](request, (error, response) => {
        if (error) {
          return reject(error);
        }
        resolve(response);
      });
    });
  };
}

// 5. Clientes con métodos basados en Promesas
const usuariosClient = {
  Autenticar: promisify(rawUsuariosClient, 'Autenticar'),
  CrearUsuario: promisify(rawUsuariosClient, 'CrearUsuario'),
  ObtenerUsuario: promisify(rawUsuariosClient, 'ObtenerUsuario'),
  ModificarUsuario: promisify(rawUsuariosClient, 'ModificarUsuario'),
  EliminarUsuario: promisify(rawUsuariosClient, 'EliminarUsuario'),
  BuscarUsuarios: promisify(rawUsuariosClient, 'BuscarUsuarios'),
  ObtenerUsuariosNoAsignados: promisify(rawUsuariosClient, 'ObtenerUsuariosNoAsignados'),
  ObtenerUsuariosPorTienda: promisify(rawUsuariosClient, 'ObtenerUsuariosPorTienda')
};

const tiendasClient = {
  CrearTienda: promisify(rawTiendasClient, 'CrearTienda'),
  ObtenerTienda: promisify(rawTiendasClient, 'ObtenerTienda'),
  ModificarTienda: promisify(rawTiendasClient, 'ModificarTienda'),
  EliminarTienda: promisify(rawTiendasClient, 'EliminarTienda'),
  CambiarEstadoTienda: promisify(rawTiendasClient, 'CambiarEstadoTienda'),
  BuscarTiendas: promisify(rawTiendasClient, 'BuscarTiendas'),
  AsignarUsuarios: promisify(rawTiendasClient, 'AsignarUsuarios'),
  DesasignarUsuario: promisify(rawTiendasClient, 'DesasignarUsuario'),
  AsignarProductos: promisify(rawTiendasClient, 'AsignarProductos'),
  DesasignarProducto: promisify(rawTiendasClient, 'DesasignarProducto')
};

const productosClient = {
  CrearProducto: promisify(rawProductosClient, 'CrearProducto'),
  ObtenerProducto: promisify(rawProductosClient, 'ObtenerProducto'),
  ModificarProducto: promisify(rawProductosClient, 'ModificarProducto'),
  ModificarStock: promisify(rawProductosClient, 'ModificarStock'),
  EliminarProducto: promisify(rawProductosClient, 'EliminarProducto'),
  BuscarProductos: promisify(rawProductosClient, 'BuscarProductos'),
  ObtenerProductosPorTienda: promisify(rawProductosClient, 'ObtenerProductosPorTienda'),
  ObtenerProductosNoAsignados: promisify(rawProductosClient, 'ObtenerProductosNoAsignados')
};

module.exports = {
  usuariosClient,
  tiendasClient,
  productosClient,
  rawUsuariosClient,
  rawTiendasClient,
  rawProductosClient
};
