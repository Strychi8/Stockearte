# 📜 Contratos de Interfaz gRPC - Protocol Buffers (proto3)

Este directorio contiene las definiciones de contratos de comunicación del sistema **Stockearte**. Utiliza **Protocol Buffers v3 (proto3)** como fuente única de la verdad (*single source of truth*) para estructurar los mensajes y métodos RPC compartidos entre el API Gateway (Node.js) y los microservicios backend (Python).

---

## 1. Rol de los Contratos en la Arquitectura Políglota

Los archivos `.proto` definen la interfaz de comunicación mediante el lenguaje IDL (*Interface Definition Language*):
* **Independencia de lenguaje:** Permite que un cliente en Node.js invoque métodos en un servidor Python 3 sin compartir dependencias ni código de dominio.
* **Serialización binaria sobre HTTP/2:** Protobuf serializa los datos en formato binario compacto y los transmite sobre canales multiplexados HTTP/2.
* **Tipado estricto:** Valida los tipos de datos de las peticiones y respuestas antes de procesar la lógica de negocio o interactuar con la base de datos.

---

## 2. Catálogo de Servicios y Métodos RPC

El sistema distribuye sus operaciones en 3 servicios:

### 👤 `usuario.proto` - Paquete: `stockearte.usuario`
Servicio para autenticación, gestión de operadores y asignación de sucursales.

| Método RPC | Petición (Request) | Respuesta (Response) | Descripción |
| :--- | :--- | :--- | :--- |
| `Autenticar` | `AutenticarRequest` | `AutenticarResponse` | Valida credenciales de login y estado de habilitación |
| `CrearUsuario` | `CrearUsuarioRequest` | `CrearUsuarioResponse` | Da de alta un operador con rol (`CASA_CENTRAL` o `TIENDA`) |
| `ObtenerUsuario` | `ObtenerUsuarioRequest` | `ObtenerUsuarioResponse` | Consulta los datos de un usuario por su identificador |
| `ModificarUsuario` | `ModificarUsuarioRequest` | `ModificarUsuarioResponse` | Modifica datos personales, contraseña o tienda asignada |
| `EliminarUsuario` | `EliminarUsuarioRequest` | `EliminarUsuarioResponse` | Elimina un usuario del sistema |
| `BuscarUsuarios` | `BuscarUsuariosRequest` | `BuscarUsuariosResponse` | Filtra usuarios por nombre o tienda asignada |
| `ObtenerUsuariosNoAsignados` | `ObtenerUsuariosNoAsignadosRequest` | `ObtenerUsuariosNoAsignadosResponse` | Lista operadores sin tienda física asignada |
| `ObtenerUsuariosPorTienda` | `ObtenerUsuariosPorTiendaRequest` | `ObtenerUsuariosPorTiendaResponse` | Lista los operadores asignados a una sucursal |

---

### 🏬 `tienda.proto` - Paquete: `stockearte.tienda`
Servicio para administración de tiendas físicas, estado operativo y asignación de recursos.

| Método RPC | Petición (Request) | Respuesta (Response) | Descripción |
| :--- | :--- | :--- | :--- |
| `CrearTienda` | `CrearTiendaRequest` | `CrearTiendaResponse` | Registra una tienda con código alfanumérico, dirección, ciudad y provincia |
| `ObtenerTienda` | `ObtenerTiendaRequest` | `ObtenerTiendaResponse` | Devuelve los datos de una tienda por ID o código, junto con su personal y productos |
| `ModificarTienda` | `ModificarTiendaRequest` | `ModificarTiendaResponse` | Modifica los datos de la sucursal |
| `EliminarTienda` | `EliminarTiendaRequest` | `EliminarTiendaResponse` | Elimina una sucursal física del sistema |
| `CambiarEstadoTienda` | `CambiarEstadoTiendaRequest` | `CambiarEstadoTiendaResponse` | Modifica el estado de habilitación de la sucursal |
| `BuscarTiendas` | `BuscarTiendasRequest` | `BuscarTiendasResponse` | Filtra tiendas por código y estado de habilitación |
| `AsignarUsuarios` | `AsignarUsuariosRequest` | `AsignarUsuariosResponse` | Vincula múltiples operadores a la sucursal |
| `DesasignarUsuario` | `DesasignarUsuarioRequest` | `DesasignarUsuarioResponse` | Desvincula un operador de la sucursal |
| `AsignarProductos` | `AsignarProductosRequest` | `AsignarProductosResponse` | Vincula productos al inventario local con stock inicial en 0 |
| `DesasignarProducto` | `DesasignarProductoRequest` | `DesasignarProductoResponse` | Desvincula un producto del stock local |

---

### 📦 `producto.proto` - Paquete: `stockearte.producto`
Servicio para administración del catálogo de productos y control de stock por sucursal.

| Método RPC | Petición (Request) | Respuesta (Response) | Descripción |
| :--- | :--- | :--- | :--- |
| `CrearProducto` | `CrearProductoRequest` | `CrearProductoResponse` | Registra un artículo con código inmutable de 10 caracteres y asignación inicial |
| `ObtenerProducto` | `ObtenerProductoRequest` | `ObtenerProductoResponse` | Devuelve el producto y el desglose de stock por sucursal |
| `ModificarProducto` | `ModificarProductoRequest` | `ModificarProductoResponse` | Modifica nombre, talle, color y foto. Mantiene el código inmutable |
| `ModificarStock` | `ModificarStockRequest` | `ModificarStockResponse` | Modifica las unidades de stock para una tienda específica |
| `EliminarProducto` | `EliminarProductoRequest` | `EliminarProductoResponse` | Da de baja un artículo del catálogo general |
| `BuscarProductos` | `BuscarProductosRequest` | `BuscarProductosResponse` | Filtra productos por nombre, código, talle, color y tienda |
| `ObtenerProductosPorTienda` | `ObtenerProductosPorTiendaRequest` | `ObtenerProductosPorTiendaResponse` | Devuelve los artículos asignados a una sucursal |
| `ObtenerProductosNoAsignados` | `ObtenerProductosNoAsignadosRequest` | `ObtenerProductosNoAsignadosResponse` | Devuelve los artículos del catálogo no asignados a una tienda |

---

## 3. Estándares y Reglas de Diseño (Buf Lint)

El proyecto utiliza **Buf** para validar la consistencia de los contratos mediante el archivo `buf.yaml`:

```yaml
version: v1
lint:
  use:
    - STANDARD
  except:
    - PACKAGE_VERSION_SUFFIX
    - PACKAGE_DIRECTORY_MATCH
    - DIRECTORY_SAME_PACKAGE
```

### Reglas aplicadas:
1. **`RPC_REQUEST_RESPONSE_UNIQUE`:** Cada método RPC define sus propios mensajes de `Request` y `Response`. No reutiliza mensajes genéricos entre métodos distintos. Esto permite modificar un método sin afectar a los demás.
2. **Convenciones de nombres:**
   * Servicios y mensajes en **`PascalCase`** (ej. `CrearProductoRequest`, `TiendasService`).
   * Campos en **`snake_case`** (ej. `nombre_usuario`, `codigo_tienda`, `nuevo_stock`).
3. **Uso de `optional`:** Los filtros de búsqueda usan la palabra clave `optional` para diferenciar un valor ausente de un valor por defecto de Protobuf (ej. `optional int64 filtro_tienda_id`).

---

## 4. Consumo y Compilación Políglota

### En Python (Backend - Compilación Estática)
Los microservicios en Python utilizan stubs precompilados. Para compilar los archivos de mensajes (`*_pb2.py`) y de servicios (`*_pb2_grpc.py`):

```bash
# Desde la raíz del repositorio
python -m grpc_tools.protoc -I proto --python_out=proto --grpc_python_out=proto proto/*.proto
```

Los servidores importan los módulos generados:
* `services/usuarios/server.py` importa `usuario_pb2` y `usuario_pb2_grpc`.
* `services/tiendas/server.py` importa `tienda_pb2` y `tienda_pb2_grpc`.
* `services/productos/server.py` importa `producto_pb2` y `producto_pb2_grpc`.

### En Node.js (API Gateway - Carga Dinámica en Runtime)
El API Gateway no requiere precompilación. Utiliza `@grpc/proto-loader` en `src/grpcClients.js` para parsear los contratos `.proto` al iniciar el servidor:

```javascript
const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');

const pkgDef = protoLoader.loadSync(path.join(__dirname, '../../proto/usuario.proto'), {
  keepCase: true,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true
});

const usuarioProto = grpc.loadPackageDefinition(pkgDef).stockearte.usuario;
```

---

## 5. Buenas Prácticas para la Evolución de los Esquemas

Para mantener compatibilidad hacia atrás y hacia adelante (*backward and forward compatibility*):

* **Conservar identificadores numéricos:** Nunca cambies el tag numérico (`= 1;`, `= 2;`) de un campo existente.
* **Reservar tags eliminados:** Si eliminas un campo, márcalo como `reserved` para evitar colisiones en versiones futuras:
  ```protobuf
  reserved 3, 5;
  reserved "campo_antiguo";
  ```
* **Agregar campos como opcionales:** Todo campo nuevo agregado a un mensaje existente debe ser opcional para no romper clientes que usen versiones anteriores del contrato.

---

## 6. Recursos Adicionales

- [**Documentación Oficial de Protocol Buffers (proto3)**](https://protobuf.dev/): Especificación del lenguaje, tipos escalares y reglas de codificación.
- [**Documentación Oficial de gRPC**](https://grpc.io/docs/): Guía de RPC y arquitectura sobre HTTP/2.
- [**Guía de Buf CLI y Reglas de Linting**](https://buf.build/docs/lint/overview): Reglas de validación y linter para esquemas Protobuf.
- [**gRPC en Python**](https://grpc.io/docs/languages/python/quickstart/): Compilación de stubs y creación de servidores en Python.
- [**@grpc/proto-loader para Node.js**](https://github.com/grpc/grpc-node/tree/master/packages/proto-loader): Carga dinámica de contratos `.proto` en tiempo de ejecución.
