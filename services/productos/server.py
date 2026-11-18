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
from services.common.database import get_db_cursor, inicializar_bd_si_no_existe


class ProductosServiceServicer(producto_pb2_grpc.ProductosServiceServicer):
    """Implementación de ProductosService con persistencia real en PostgreSQL."""

    def _generar_codigo_unico(self, cur):
        """Genera un código aleatorio alfanumérico único de 10 caracteres."""
        caracteres = string.ascii_uppercase + string.digits
        while True:
            codigo = "".join(random.choices(caracteres, k=10))
            cur.execute("SELECT 1 FROM productos WHERE codigo = %s", (codigo,))
            if not cur.fetchone():
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

        try:
            with get_db_cursor(commit=True) as cur:
                codigo_aleatorio = self._generar_codigo_unico(cur)

                cur.execute("""
                    INSERT INTO productos (codigo, nombre, talle, color, foto, habilitado)
                    VALUES (%s, %s, %s, %s, %s, TRUE)
                    RETURNING id, codigo, nombre, talle, color, foto, habilitado
                """, (
                    codigo_aleatorio,
                    nombre_limpio,
                    request.talle.strip(),
                    request.color.strip(),
                    request.foto.strip() if request.foto else ""
                ))
                nuevo = cur.fetchone()

                # Asignar a tiendas con stock 0 en el alta
                for tid in request.tienda_ids:
                    cur.execute("""
                        INSERT INTO tienda_inventario (tienda_id, producto_id, stock)
                        VALUES (%s, %s, 0)
                        ON CONFLICT (tienda_id, producto_id) DO NOTHING
                    """, (tid, nuevo["id"]))

            return producto_pb2.CrearProductoResponse(
                exito=True,
                mensaje=f"Producto '{nombre_limpio}' creado exitosamente con código único {codigo_aleatorio}",
                producto=self._dict_to_model(nuevo)
            )
        except Exception as e:
            print(f"[gRPC Productos ERROR] CrearProducto: {e}")
            return producto_pb2.CrearProductoResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                producto=None
            )

    def ObtenerProducto(self, request, context):
        print(f"[gRPC Productos] ObtenerProducto -> ID: {request.id}")
        try:
            with get_db_cursor() as cur:
                cur.execute("SELECT * FROM productos WHERE id = %s", (request.id,))
                producto = cur.fetchone()

                if not producto:
                    return producto_pb2.ObtenerProductoResponse(
                        exito=False,
                        mensaje=f"Producto con ID {request.id} no encontrado",
                        producto=None,
                        stocks=[]
                    )

                query_stocks = """
                    SELECT ti.tienda_id, ti.stock, t.codigo as codigo_tienda
                    FROM tienda_inventario ti
                    JOIN tiendas t ON ti.tienda_id = t.id
                    WHERE ti.producto_id = %s
                """
                params = [request.id]

                # Si consulta un usuario de tienda, solo ve su stock si la tienda está habilitada
                if request.HasField("tienda_id_solicitante") and request.tienda_id_solicitante > 0:
                    query_stocks += " AND ti.tienda_id = %s AND t.habilitada = TRUE"
                    params.append(request.tienda_id_solicitante)

                query_stocks += " ORDER BY t.codigo ASC"
                cur.execute(query_stocks, tuple(params))
                stocks_rows = cur.fetchall()

            stocks_pb = [
                producto_pb2.StockTiendaInfo(
                    tienda_id=r["tienda_id"],
                    codigo_tienda=r["codigo_tienda"],
                    stock=r["stock"]
                )
                for r in stocks_rows
            ]

            return producto_pb2.ObtenerProductoResponse(
                exito=True,
                mensaje="Producto encontrado",
                producto=self._dict_to_model(producto),
                stocks=stocks_pb
            )
        except Exception as e:
            print(f"[gRPC Productos ERROR] ObtenerProducto: {e}")
            return producto_pb2.ObtenerProductoResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                producto=None,
                stocks=[]
            )

    def ModificarProducto(self, request, context):
        print(f"[gRPC Productos] ModificarProducto -> ID: {request.id}")
        nombre_limpio = request.nombre.strip()

        if not nombre_limpio:
            return producto_pb2.ModificarProductoResponse(
                exito=False,
                mensaje="El nombre del producto no puede estar vacío",
                producto=None
            )

        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("SELECT id FROM productos WHERE id = %s", (request.id,))
                if not cur.fetchone():
                    return producto_pb2.ModificarProductoResponse(
                        exito=False,
                        mensaje=f"Producto con ID {request.id} no encontrado",
                        producto=None
                    )

                # Regla de negocio: El código único de 10 caracteres permanece inmutable
                cur.execute("""
                    UPDATE productos
                    SET nombre = %s, talle = %s, color = %s, foto = %s
                    WHERE id = %s
                    RETURNING id, codigo, nombre, talle, color, foto, habilitado
                """, (
                    nombre_limpio,
                    request.talle.strip(),
                    request.color.strip(),
                    request.foto.strip() if request.foto else "",
                    request.id
                ))
                actualizado = cur.fetchone()

            return producto_pb2.ModificarProductoResponse(
                exito=True,
                mensaje="Producto modificado correctamente",
                producto=self._dict_to_model(actualizado)
            )
        except Exception as e:
            print(f"[gRPC Productos ERROR] ModificarProducto: {e}")
            return producto_pb2.ModificarProductoResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                producto=None
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

        try:
            with get_db_cursor(commit=True) as cur:
                # Validar existencia y estado operativo de la tienda
                cur.execute("SELECT id, codigo, habilitada FROM tiendas WHERE id = %s", (request.tienda_id,))
                tienda_row = cur.fetchone()
                if not tienda_row:
                    return producto_pb2.ModificarStockResponse(
                        exito=False,
                        mensaje=f"Tienda con ID {request.tienda_id} no encontrada",
                        producto_id=request.producto_id,
                        tienda_id=request.tienda_id,
                        stock_actualizado=0
                    )
                if not tienda_row["habilitada"]:
                    return producto_pb2.ModificarStockResponse(
                        exito=False,
                        mensaje=f"Operación rechazada: La sucursal '{tienda_row['codigo']}' se encuentra inhabilitada para operar stock",
                        producto_id=request.producto_id,
                        tienda_id=request.tienda_id,
                        stock_actualizado=0
                    )

                cur.execute("SELECT nombre FROM productos WHERE id = %s", (request.producto_id,))
                prod = cur.fetchone()
                if not prod:
                    return producto_pb2.ModificarStockResponse(
                        exito=False,
                        mensaje=f"Producto con ID {request.producto_id} no encontrado",
                        producto_id=request.producto_id,
                        tienda_id=request.tienda_id,
                        stock_actualizado=0
                    )

                cur.execute("""
                    INSERT INTO tienda_inventario (tienda_id, producto_id, stock)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (tienda_id, producto_id)
                    DO UPDATE SET stock = EXCLUDED.stock
                """, (request.tienda_id, request.producto_id, request.nuevo_stock))

            return producto_pb2.ModificarStockResponse(
                exito=True,
                mensaje=f"Stock de '{prod['nombre']}' actualizado a {request.nuevo_stock} unidades",
                producto_id=request.producto_id,
                tienda_id=request.tienda_id,
                stock_actualizado=request.nuevo_stock
            )
        except Exception as e:
            print(f"[gRPC Productos ERROR] ModificarStock: {e}")
            return producto_pb2.ModificarStockResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                producto_id=request.producto_id,
                tienda_id=request.tienda_id,
                stock_actualizado=0
            )

    def EliminarProducto(self, request, context):
        print(f"[gRPC Productos] EliminarProducto -> ID: {request.id}")
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("DELETE FROM productos WHERE id = %s RETURNING id", (request.id,))
                eliminado = cur.fetchone()

            if eliminado:
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
        except Exception as e:
            print(f"[gRPC Productos ERROR] EliminarProducto: {e}")
            return producto_pb2.EliminarProductoResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                id=request.id
            )

    def BuscarProductos(self, request, context):
        print(f"[gRPC Productos] BuscarProductos -> Nombre: '{request.filtro_nombre}', Código: '{request.filtro_codigo}', Talle: '{request.filtro_talle}', Color: '{request.filtro_color}', Tienda Solicitante: {request.tienda_id_usuario if request.HasField('tienda_id_usuario') else 'Todas'}")
        try:
            es_tienda = request.HasField("tienda_id_usuario") and request.tienda_id_usuario > 0

            if es_tienda:
                # Tienda: solo productos asignados a su sucursal y SOLO si la tienda está habilitada
                query = """
                    SELECT p.id, p.codigo, p.nombre, p.talle, p.color, p.foto,
                           ti.stock, t.codigo as codigo_tienda
                    FROM productos p
                    JOIN tienda_inventario ti ON p.id = ti.producto_id
                    JOIN tiendas t ON ti.tienda_id = t.id
                    WHERE p.habilitado = TRUE AND ti.tienda_id = %s AND t.habilitada = TRUE
                """
                params = [request.tienda_id_usuario]
            else:
                # Casa Central: catálogo completo con suma consolidada de stock
                query = """
                    SELECT p.id, p.codigo, p.nombre, p.talle, p.color, p.foto,
                           COALESCE(SUM(ti.stock), 0) as stock,
                           'Casa Central' as codigo_tienda
                    FROM productos p
                    LEFT JOIN tienda_inventario ti ON p.id = ti.producto_id
                    WHERE p.habilitado = TRUE
                """
                params = []

            # Filtros adicionales
            if request.filtro_nombre and request.filtro_nombre.strip():
                query += " AND LOWER(p.nombre) LIKE %s"
                params.append(f"%{request.filtro_nombre.strip().lower()}%")

            if request.filtro_codigo and request.filtro_codigo.strip():
                query += " AND LOWER(p.codigo) LIKE %s"
                params.append(f"%{request.filtro_codigo.strip().lower()}%")

            if request.filtro_talle and request.filtro_talle.strip():
                query += " AND LOWER(p.talle) LIKE %s"
                params.append(f"%{request.filtro_talle.strip().lower()}%")

            if request.filtro_color and request.filtro_color.strip():
                query += " AND LOWER(p.color) LIKE %s"
                params.append(f"%{request.filtro_color.strip().lower()}%")

            if not es_tienda:
                query += " GROUP BY p.id, p.codigo, p.nombre, p.talle, p.color, p.foto"

            query += " ORDER BY p.id ASC"

            with get_db_cursor() as cur:
                cur.execute(query, tuple(params))
                rows = cur.fetchall()

            resultados = [
                producto_pb2.ProductoItem(
                    id=r["id"],
                    codigo=r["codigo"],
                    nombre=r["nombre"],
                    talle=r["talle"],
                    color=r["color"],
                    foto=r["foto"] or "",
                    codigo_tienda=r["codigo_tienda"],
                    stock=int(r["stock"])
                )
                for r in rows
            ]
            return producto_pb2.BuscarProductosResponse(productos=resultados)
        except Exception as e:
            print(f"[gRPC Productos ERROR] BuscarProductos: {e}")
            return producto_pb2.BuscarProductosResponse(productos=[])

    def ObtenerProductosPorTienda(self, request, context):
        print(f"[gRPC Productos] ObtenerProductosPorTienda -> Tienda ID: {request.tienda_id}")
        try:
            with get_db_cursor() as cur:
                cur.execute("""
                    SELECT p.id, p.codigo, p.nombre, p.talle, p.color, p.foto,
                           ti.stock, t.codigo as codigo_tienda
                    FROM productos p
                    JOIN tienda_inventario ti ON p.id = ti.producto_id
                    JOIN tiendas t ON ti.tienda_id = t.id
                    WHERE p.habilitado = TRUE AND ti.tienda_id = %s
                    ORDER BY p.nombre ASC
                """, (request.tienda_id,))
                rows = cur.fetchall()

            items = [
                producto_pb2.ProductoItem(
                    id=r["id"],
                    codigo=r["codigo"],
                    nombre=r["nombre"],
                    talle=r["talle"],
                    color=r["color"],
                    foto=r["foto"] or "",
                    codigo_tienda=r["codigo_tienda"],
                    stock=int(r["stock"])
                )
                for r in rows
            ]
            return producto_pb2.ObtenerProductosPorTiendaResponse(productos=items)
        except Exception as e:
            print(f"[gRPC Productos ERROR] ObtenerProductosPorTienda: {e}")
            return producto_pb2.ObtenerProductosPorTiendaResponse(productos=[])

    def ObtenerProductosNoAsignados(self, request, context):
        print(f"[gRPC Productos] ObtenerProductosNoAsignados -> Tienda ID: {request.tienda_id}")
        try:
            with get_db_cursor() as cur:
                cur.execute("""
                    SELECT p.id, p.codigo, p.nombre, p.talle, p.color, p.foto
                    FROM productos p
                    WHERE p.habilitado = TRUE
                      AND p.id NOT IN (
                          SELECT producto_id FROM tienda_inventario WHERE tienda_id = %s
                      )
                    ORDER BY p.nombre ASC
                """, (request.tienda_id,))
                rows = cur.fetchall()

            items = [
                producto_pb2.ProductoItem(
                    id=r["id"],
                    codigo=r["codigo"],
                    nombre=r["nombre"],
                    talle=r["talle"],
                    color=r["color"],
                    foto=r["foto"] or "",
                    codigo_tienda="Sin asignar",
                    stock=0
                )
                for r in rows
            ]
            return producto_pb2.ObtenerProductosNoAsignadosResponse(productos=items)
        except Exception as e:
            print(f"[gRPC Productos ERROR] ObtenerProductosNoAsignados: {e}")
            return producto_pb2.ObtenerProductosNoAsignadosResponse(productos=[])

    def _dict_to_model(self, p):
        return producto_pb2.ProductoModel(
            id=p["id"],
            codigo=p["codigo"],
            nombre=p["nombre"],
            talle=p["talle"],
            color=p["color"],
            foto=p["foto"] or "",
            habilitado=bool(p["habilitado"])
        )


def serve():
    inicializar_bd_si_no_existe()
    port = "50052"
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    producto_pb2_grpc.add_ProductosServiceServicer_to_server(ProductosServiceServicer(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"[INFO] Servidor gRPC de Productos corriendo en http://localhost:{port}")
    print("[INFO] Presiona Ctrl+C para detenerlo.\n")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
