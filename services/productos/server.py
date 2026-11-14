import sys
import os
import random
import string
from concurrent import futures
import grpc

# Agregar la raíz del proyecto y la carpeta proto a sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
PROTO_DIR = os.path.join(BASE_DIR, "proto")
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if PROTO_DIR not in sys.path:
    sys.path.insert(0, PROTO_DIR)

import producto_pb2
import producto_pb2_grpc

# Base de datos simulada en memoria para pruebas
PRODUCTOS_DB = [
    {
        "id": 1,
        "codigo": "PRD8492041",
        "nombre": "Remera Lisa de Algodón",
        "talle": "M",
        "color": "Negro",
        "foto": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500",
        "habilitado": True,
        "stocks": {
            1: {"codigo_tienda": "SUC-PALERMO-01", "stock": 15},
            2: {"codigo_tienda": "SUC-CORDOBA-01", "stock": 8}
        }
    },
    {
        "id": 2,
        "codigo": "PRD7742019",
        "nombre": "Pantalón Denim Clásico",
        "talle": "42",
        "color": "Azul",
        "foto": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
        "habilitado": True,
        "stocks": {
            1: {"codigo_tienda": "SUC-PALERMO-01", "stock": 20}
        }
    },
    {
        "id": 3,
        "codigo": "PRD3910544",
        "nombre": "Buzo Hoodie Frisa",
        "talle": "L",
        "color": "Gris",
        "foto": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500",
        "habilitado": True,
        "stocks": {}
    }
]


class ProductosServiceServicer(producto_pb2_grpc.ProductosServiceServicer):
    """Implementación completa en memoria para el servicio gRPC de Productos."""

    def _generar_codigo_unico(self):
        """Genera un código aleatorio alfanumérico único de 10 caracteres."""
        caracteres = string.ascii_uppercase + string.digits
        while True:
            codigo = "".join(random.choices(caracteres, k=10))
            if not any(p["codigo"] == codigo for p in PRODUCTOS_DB):
                return codigo

    def CrearProducto(self, request, context):
        print(f"[gRPC Productos] CrearProducto -> Nombre: '{request.nombre}', Tiendas iniciales: {list(request.tienda_ids)}")

        nombre_limpio = request.nombre.strip()
        if not nombre_limpio:
            return producto_pb2.CrearProductoResponse(
                exito=False,
                mensaje="El nombre del producto no puede estar vacío",
                producto=None
            )

        nuevo_id = max(p["id"] for p in PRODUCTOS_DB) + 1 if PRODUCTOS_DB else 1
        codigo_aleatorio = self._generar_codigo_unico()

        # El stock se inicializa en 0 para cada tienda asignada en el alta
        stocks_iniciales = {}
        for tid in request.tienda_ids:
            stocks_iniciales[tid] = {
                "codigo_tienda": f"SUC-{tid:02d}",
                "stock": 0
            }

        nuevo_producto = {
            "id": nuevo_id,
            "codigo": codigo_aleatorio,
            "nombre": nombre_limpio,
            "talle": request.talle.strip(),
            "color": request.color.strip(),
            "foto": request.foto.strip() if request.foto else "",
            "habilitado": True,
            "stocks": stocks_iniciales
        }
        PRODUCTOS_DB.append(nuevo_producto)

        return producto_pb2.CrearProductoResponse(
            exito=True,
            mensaje=f"Producto '{nombre_limpio}' creado exitosamente con código único {codigo_aleatorio}",
            producto=self._dict_to_model(nuevo_producto)
        )

    def ObtenerProducto(self, request, context):
        print(f"[gRPC Productos] ObtenerProducto -> ID: {request.id}, Tienda solicitante: {request.tienda_id_solicitante if request.HasField('tienda_id_solicitante') else 'Casa Central'}")
        producto = next((p for p in PRODUCTOS_DB if p["id"] == request.id), None)

        if not producto:
            return producto_pb2.ObtenerProductoResponse(
                exito=False,
                mensaje=f"Producto con ID {request.id} no encontrado",
                producto=None,
                stocks=[]
            )

        stocks_list = []
        if request.HasField("tienda_id_solicitante") and request.tienda_id_solicitante > 0:
            tid = request.tienda_id_solicitante
            if tid in producto["stocks"]:
                s = producto["stocks"][tid]
                stocks_list.append(producto_pb2.StockTiendaInfo(
                    tienda_id=tid,
                    codigo_tienda=s["codigo_tienda"],
                    stock=s["stock"]
                ))
        else:
            # Casa Central visualiza el stock detallado de todas las sucursales
            for tid, s in producto["stocks"].items():
                stocks_list.append(producto_pb2.StockTiendaInfo(
                    tienda_id=tid,
                    codigo_tienda=s["codigo_tienda"],
                    stock=s["stock"]
                ))

        return producto_pb2.ObtenerProductoResponse(
            exito=True,
            mensaje="Producto encontrado",
            producto=self._dict_to_model(producto),
            stocks=stocks_list
        )

    def ModificarProducto(self, request, context):
        print(f"[gRPC Productos] ModificarProducto -> ID: {request.id}")
        producto = next((p for p in PRODUCTOS_DB if p["id"] == request.id), None)

        if not producto:
            return producto_pb2.ModificarProductoResponse(
                exito=False,
                mensaje=f"Producto con ID {request.id} no encontrado",
                producto=None
            )

        # Regla de negocio: El código único de 10 caracteres permanece inmutable
        producto["nombre"] = request.nombre.strip()
        producto["talle"] = request.talle.strip()
        producto["color"] = request.color.strip()
        if request.foto:
            producto["foto"] = request.foto.strip()

        return producto_pb2.ModificarProductoResponse(
            exito=True,
            mensaje="Producto modificado correctamente",
            producto=self._dict_to_model(producto)
        )

    def ModificarStock(self, request, context):
        print(f"[gRPC Productos] ModificarStock -> Producto ID: {request.producto_id}, Tienda ID: {request.tienda_id}, Nuevo Stock: {request.nuevo_stock}")

        if request.nuevo_stock < 0:
            return producto_pb2.ModificarStockResponse(
                exito=False,
                mensaje="El stock no puede ser un valor negativo",
                producto_id=request.producto_id,
                tienda_id=request.tienda_id,
                stock_actualizado=0
            )

        producto = next((p for p in PRODUCTOS_DB if p["id"] == request.producto_id), None)
        if not producto:
            return producto_pb2.ModificarStockResponse(
                exito=False,
                mensaje=f"Producto con ID {request.producto_id} no encontrado",
                producto_id=request.producto_id,
                tienda_id=request.tienda_id,
                stock_actualizado=0
            )

        if request.tienda_id not in producto["stocks"]:
            producto["stocks"][request.tienda_id] = {
                "codigo_tienda": f"SUC-{request.tienda_id:02d}",
                "stock": request.nuevo_stock
            }
        else:
            producto["stocks"][request.tienda_id]["stock"] = request.nuevo_stock

        return producto_pb2.ModificarStockResponse(
            exito=True,
            mensaje=f"Stock de '{producto['nombre']}' actualizado a {request.nuevo_stock} unidades",
            producto_id=request.producto_id,
            tienda_id=request.tienda_id,
            stock_actualizado=request.nuevo_stock
        )

    def EliminarProducto(self, request, context):
        print(f"[gRPC Productos] EliminarProducto -> ID: {request.id}")
        global PRODUCTOS_DB
        inicial = len(PRODUCTOS_DB)
        PRODUCTOS_DB = [p for p in PRODUCTOS_DB if p["id"] != request.id]

        if len(PRODUCTOS_DB) < inicial:
            return producto_pb2.EliminarProductoResponse(
                exito=True,
                mensaje="Producto eliminado correctamente",
                id=request.id
            )

        return producto_pb2.EliminarProductoResponse(
            exito=False,
            mensaje=f"Producto con ID {request.id} no encontrado",
            id=request.id
        )

    def BuscarProductos(self, request, context):
        print(f"[gRPC Productos] BuscarProductos -> Nombre: '{request.filtro_nombre}', Código: '{request.filtro_codigo}', Talle: '{request.filtro_talle}', Color: '{request.filtro_color}', Tienda Solicitante: {request.tienda_id_usuario if request.HasField('tienda_id_usuario') else 'Todas'}")

        filtro_nom = request.filtro_nombre.strip().lower() if request.filtro_nombre else ""
        filtro_cod = request.filtro_codigo.strip().lower() if request.filtro_codigo else ""
        filtro_tal = request.filtro_talle.strip().lower() if request.filtro_talle else ""
        filtro_col = request.filtro_color.strip().lower() if request.filtro_color else ""
        es_tienda = request.HasField("tienda_id_usuario") and request.tienda_id_usuario > 0

        resultados = []
        for p in PRODUCTOS_DB:
            if not p.get("habilitado", True):
                continue
            if filtro_nom and filtro_nom not in p["nombre"].lower():
                continue
            if filtro_cod and filtro_cod not in p["codigo"].lower():
                continue
            if filtro_tal and filtro_tal not in p["talle"].lower():
                continue
            if filtro_col and filtro_col not in p["color"].lower():
                continue

            if es_tienda:
                tid = request.tienda_id_usuario
                if tid not in p["stocks"]:
                    continue
                stock_info = p["stocks"][tid]
                codigo_tienda = stock_info["codigo_tienda"]
                stock_val = stock_info["stock"]
            else:
                # Casa Central: lista todos los productos y suma de stock general
                codigo_tienda = "Casa Central"
                stock_val = sum(s["stock"] for s in p["stocks"].values())

            resultados.append(producto_pb2.ProductoItem(
                id=p["id"],
                codigo=p["codigo"],
                nombre=p["nombre"],
                talle=p["talle"],
                color=p["color"],
                foto=p["foto"],
                codigo_tienda=codigo_tienda,
                stock=stock_val
            ))

        return producto_pb2.BuscarProductosResponse(productos=resultados)

    def ObtenerProductosPorTienda(self, request, context):
        print(f"[gRPC Productos] ObtenerProductosPorTienda -> Tienda ID: {request.tienda_id}")
        tid = request.tienda_id
        items = []

        for p in PRODUCTOS_DB:
            if not p.get("habilitado", True):
                continue
            if tid in p["stocks"]:
                stock_info = p["stocks"][tid]
                items.append(producto_pb2.ProductoItem(
                    id=p["id"],
                    codigo=p["codigo"],
                    nombre=p["nombre"],
                    talle=p["talle"],
                    color=p["color"],
                    foto=p["foto"],
                    codigo_tienda=stock_info["codigo_tienda"],
                    stock=stock_info["stock"]
                ))

        return producto_pb2.ObtenerProductosPorTiendaResponse(productos=items)

    def ObtenerProductosNoAsignados(self, request, context):
        print(f"[gRPC Productos] ObtenerProductosNoAsignados -> Tienda ID: {request.tienda_id}")
        tid = request.tienda_id
        items = []

        for p in PRODUCTOS_DB:
            if not p.get("habilitado", True):
                continue
            if tid not in p["stocks"]:
                items.append(producto_pb2.ProductoItem(
                    id=p["id"],
                    codigo=p["codigo"],
                    nombre=p["nombre"],
                    talle=p["talle"],
                    color=p["color"],
                    foto=p["foto"],
                    codigo_tienda="No asignado",
                    stock=0
                ))

        return producto_pb2.ObtenerProductosNoAsignadosResponse(productos=items)

    def _dict_to_model(self, p):
        return producto_pb2.ProductoModel(
            id=p["id"],
            codigo=p["codigo"],
            nombre=p["nombre"],
            talle=p["talle"],
            color=p["color"],
            foto=p["foto"],
            habilitado=p.get("habilitado", True)
        )


def serve():
    port = os.environ.get("PORT", "50052")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    producto_pb2_grpc.add_ProductosServiceServicer_to_server(ProductosServiceServicer(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"[INFO] Servidor gRPC de Productos corriendo en http://localhost:{port}")
    print("[INFO] Presiona Ctrl+C para detenerlo.\n")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
