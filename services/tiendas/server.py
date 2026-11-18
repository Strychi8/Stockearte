import sys
import os
from concurrent import futures
import grpc

# Agregar la raíz del proyecto y la carpeta proto a sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
PROTO_DIR = os.path.join(BASE_DIR, "proto")
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if PROTO_DIR not in sys.path:
    sys.path.insert(0, PROTO_DIR)

import tienda_pb2
import tienda_pb2_grpc
from services.common.database import get_db_cursor, inicializar_bd_si_no_existe


class TiendasServiceServicer(tienda_pb2_grpc.TiendasServiceServicer):
    """Implementación de TiendasService con persistencia real en PostgreSQL."""

    def CrearTienda(self, request, context):
        print(f"[gRPC Tiendas] CrearTienda -> Código: '{request.codigo}'")
        codigo_limpio = request.codigo.strip()

        if not codigo_limpio:
            return tienda_pb2.CrearTiendaResponse(
                exito=False,
                mensaje="El código de tienda no puede estar vacío",
                tienda=None
            )

        try:
            with get_db_cursor(commit=True) as cur:
                # Validar unicidad del código
                cur.execute("SELECT 1 FROM tiendas WHERE LOWER(codigo) = LOWER(%s)", (codigo_limpio,))
                if cur.fetchone():
                    return tienda_pb2.CrearTiendaResponse(
                        exito=False,
                        mensaje=f"Ya existe una tienda con el código '{codigo_limpio}'",
                        tienda=None
                    )

                cur.execute("""
                    INSERT INTO tiendas (codigo, direccion, ciudad, provincia, habilitada)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, codigo, direccion, ciudad, provincia, habilitada
                """, (
                    codigo_limpio,
                    request.direccion.strip(),
                    request.ciudad.strip(),
                    request.provincia.strip(),
                    request.habilitada
                ))
                nueva = cur.fetchone()

            return tienda_pb2.CrearTiendaResponse(
                exito=True,
                mensaje=f"Tienda '{codigo_limpio}' creada exitosamente",
                tienda=self._dict_to_model(nueva)
            )
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] CrearTienda: {e}")
            return tienda_pb2.CrearTiendaResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                tienda=None
            )

    def ObtenerTienda(self, request, context):
        print(f"[gRPC Tiendas] ObtenerTienda -> ID: {request.id if request.HasField('id') else 'N/A'}, Código: '{request.codigo if request.HasField('codigo') else 'N/A'}'")
        try:
            with get_db_cursor() as cur:
                if request.HasField("id") and request.id > 0:
                    cur.execute("SELECT * FROM tiendas WHERE id = %s", (request.id,))
                elif request.HasField("codigo") and request.codigo.strip():
                    cur.execute("SELECT * FROM tiendas WHERE LOWER(codigo) = LOWER(%s)", (request.codigo.strip(),))
                else:
                    return tienda_pb2.ObtenerTiendaResponse(
                        exito=False,
                        mensaje="Debe especificar un ID numérico o un código de tienda válido",
                        tienda=None
                    )
                tienda = cur.fetchone()

                if not tienda:
                    return tienda_pb2.ObtenerTiendaResponse(
                        exito=False,
                        mensaje="Tienda no encontrada",
                        tienda=None
                    )

                # Obtener IDs de usuarios asignados
                cur.execute("SELECT id FROM usuarios WHERE tienda_id = %s ORDER BY id ASC", (tienda["id"],))
                u_ids = [r["id"] for r in cur.fetchall()]

                # Obtener IDs de productos asignados
                cur.execute("SELECT producto_id FROM tienda_inventario WHERE tienda_id = %s ORDER BY producto_id ASC", (tienda["id"],))
                p_ids = [r["producto_id"] for r in cur.fetchall()]

            return tienda_pb2.ObtenerTiendaResponse(
                exito=True,
                mensaje="Tienda encontrada",
                tienda=self._dict_to_model(tienda)
            )
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] ObtenerTienda: {e}")
            return tienda_pb2.ObtenerTiendaResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                tienda=None
            )

    def ModificarTienda(self, request, context):
        print(f"[gRPC Tiendas] ModificarTienda -> ID: {request.id}")
        codigo_limpio = request.codigo.strip()

        if not codigo_limpio:
            return tienda_pb2.ModificarTiendaResponse(
                exito=False,
                mensaje="El código de tienda no puede estar vacío",
                tienda=None
            )

        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("SELECT id FROM tiendas WHERE id = %s", (request.id,))
                if not cur.fetchone():
                    return tienda_pb2.ModificarTiendaResponse(
                        exito=False,
                        mensaje=f"Tienda con ID {request.id} no encontrada",
                        tienda=None
                    )

                # Validar unicidad de código
                cur.execute("""
                    SELECT id FROM tiendas
                    WHERE LOWER(codigo) = LOWER(%s) AND id != %s
                """, (codigo_limpio, request.id))
                if cur.fetchone():
                    return tienda_pb2.ModificarTiendaResponse(
                        exito=False,
                        mensaje=f"El código '{codigo_limpio}' ya pertenece a otra tienda",
                        tienda=None
                    )

                cur.execute("""
                    UPDATE tiendas
                    SET codigo = %s, direccion = %s, ciudad = %s, provincia = %s, habilitada = %s
                    WHERE id = %s
                    RETURNING id, codigo, direccion, ciudad, provincia, habilitada
                """, (
                    codigo_limpio,
                    request.direccion.strip(),
                    request.ciudad.strip(),
                    request.provincia.strip(),
                    request.habilitada,
                    request.id
                ))
                actualizada = cur.fetchone()

                cur.execute("SELECT id FROM usuarios WHERE tienda_id = %s", (request.id,))
                u_ids = [r["id"] for r in cur.fetchall()]

                cur.execute("SELECT producto_id FROM tienda_inventario WHERE tienda_id = %s", (request.id,))
                p_ids = [r["producto_id"] for r in cur.fetchall()]

            return tienda_pb2.ModificarTiendaResponse(
                exito=True,
                mensaje="Tienda modificada correctamente",
                tienda=self._dict_to_model(actualizada)
            )
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] ModificarTienda: {e}")
            return tienda_pb2.ModificarTiendaResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                tienda=None
            )

    def EliminarTienda(self, request, context):
        print(f"[gRPC Tiendas] EliminarTienda -> ID: {request.id}")
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("DELETE FROM tiendas WHERE id = %s RETURNING id", (request.id,))
                eliminada = cur.fetchone()

            if eliminada:
                return tienda_pb2.EliminarTiendaResponse(
                    exito=True,
                    mensaje=f"Tienda con ID {request.id} eliminada correctamente",
                    id=request.id
                )
            return tienda_pb2.EliminarTiendaResponse(
                exito=False,
                mensaje=f"Tienda con ID {request.id} no encontrada",
                id=request.id
            )
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] EliminarTienda: {e}")
            return tienda_pb2.EliminarTiendaResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                id=request.id
            )

    def CambiarEstadoTienda(self, request, context):
        print(f"[gRPC Tiendas] CambiarEstadoTienda -> ID: {request.id}, Habilitada: {request.habilitada}")
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("""
                    UPDATE tiendas
                    SET habilitada = %s
                    WHERE id = %s
                    RETURNING id, codigo, direccion, ciudad, provincia, habilitada
                """, (request.habilitada, request.id))
                tienda = cur.fetchone()

                if not tienda:
                    return tienda_pb2.CambiarEstadoTiendaResponse(
                        exito=False,
                        mensaje=f"Tienda con ID {request.id} no encontrada",
                        tienda=None
                    )

                cur.execute("SELECT id FROM usuarios WHERE tienda_id = %s", (request.id,))
                u_ids = [r["id"] for r in cur.fetchall()]

                cur.execute("SELECT producto_id FROM tienda_inventario WHERE tienda_id = %s", (request.id,))
                p_ids = [r["producto_id"] for r in cur.fetchall()]

            estado_texto = "habilitada" if request.habilitada else "inhabilitada"
            return tienda_pb2.CambiarEstadoTiendaResponse(
                exito=True,
                mensaje=f"Estado de la tienda '{tienda['codigo']}' actualizado a {estado_texto}",
                tienda=self._dict_to_model(tienda)
            )
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] CambiarEstadoTienda: {e}")
            return tienda_pb2.CambiarEstadoTiendaResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                tienda=None
            )

    def BuscarTiendas(self, request, context):
        print(f"[gRPC Tiendas] BuscarTiendas -> Filtro Código: '{request.filtro_codigo}', Filtro Habilitada: {request.filtro_habilitada if request.HasField('filtro_habilitada') else 'Todos'}")
        try:
            query = "SELECT id, codigo, ciudad, provincia, habilitada FROM tiendas WHERE 1=1"
            params = []

            if request.filtro_codigo and request.filtro_codigo.strip():
                query += " AND LOWER(codigo) LIKE %s"
                params.append(f"%{request.filtro_codigo.strip().lower()}%")

            if request.HasField("filtro_habilitada"):
                query += " AND habilitada = %s"
                params.append(request.filtro_habilitada)

            query += " ORDER BY id ASC"

            with get_db_cursor() as cur:
                cur.execute(query, tuple(params))
                rows = cur.fetchall()

            resultados = [
                tienda_pb2.TiendaItem(
                    id=r["id"],
                    codigo=r["codigo"],
                    habilitada=r["habilitada"],
                    ciudad=r["ciudad"],
                    provincia=r["provincia"]
                )
                for r in rows
            ]
            return tienda_pb2.BuscarTiendasResponse(tiendas=resultados)
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] BuscarTiendas: {e}")
            return tienda_pb2.BuscarTiendasResponse(tiendas=[])

    def AsignarUsuarios(self, request, context):
        print(f"[gRPC Tiendas] AsignarUsuarios -> Tienda ID: {request.tienda_id}, Usuarios: {list(request.usuario_ids)}")
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("SELECT id FROM tiendas WHERE id = %s", (request.tienda_id,))
                if not cur.fetchone():
                    return tienda_pb2.AsignarUsuariosResponse(
                        exito=False,
                        mensaje=f"Tienda con ID {request.tienda_id} no encontrada",
                        tienda_id=request.tienda_id,
                        usuario_ids=[]
                    )

                for uid in request.usuario_ids:
                    cur.execute("""
                        UPDATE usuarios
                        SET tienda_id = %s, rol = 'TIENDA'
                        WHERE id = %s
                    """, (request.tienda_id, uid))

                cur.execute("SELECT id FROM usuarios WHERE tienda_id = %s ORDER BY id ASC", (request.tienda_id,))
                final_ids = [r["id"] for r in cur.fetchall()]

            return tienda_pb2.AsignarUsuariosResponse(
                exito=True,
                mensaje="Usuarios asignados correctamente a la tienda",
                tienda_id=request.tienda_id,
                usuario_ids=final_ids
            )
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] AsignarUsuarios: {e}")
            return tienda_pb2.AsignarUsuariosResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                tienda_id=request.tienda_id,
                usuario_ids=[]
            )

    def DesasignarUsuario(self, request, context):
        print(f"[gRPC Tiendas] DesasignarUsuario -> Tienda ID: {request.tienda_id}, Usuario ID: {request.usuario_id}")
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("""
                    UPDATE usuarios
                    SET tienda_id = NULL, rol = 'CASA_CENTRAL'
                    WHERE id = %s AND tienda_id = %s
                    RETURNING id
                """, (request.usuario_id, request.tienda_id))
                updated = cur.fetchone()

            if updated:
                return tienda_pb2.DesasignarUsuarioResponse(
                    exito=True,
                    mensaje=f"Usuario {request.usuario_id} desasignado de la tienda",
                    tienda_id=request.tienda_id,
                    usuario_id=request.usuario_id
                )
            return tienda_pb2.DesasignarUsuarioResponse(
                exito=False,
                mensaje="El usuario no pertenecía a esa tienda o no existe",
                tienda_id=request.tienda_id,
                usuario_id=request.usuario_id
            )
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] DesasignarUsuario: {e}")
            return tienda_pb2.DesasignarUsuarioResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                tienda_id=request.tienda_id,
                usuario_id=request.usuario_id
            )

    def AsignarProductos(self, request, context):
        print(f"[gRPC Tiendas] AsignarProductos -> Tienda ID: {request.tienda_id}, Productos: {list(request.producto_ids)}")
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("SELECT id FROM tiendas WHERE id = %s", (request.tienda_id,))
                if not cur.fetchone():
                    return tienda_pb2.AsignarProductosResponse(
                        exito=False,
                        mensaje=f"Tienda con ID {request.tienda_id} no encontrada",
                        tienda_id=request.tienda_id,
                        producto_ids=[]
                    )

                for pid in request.producto_ids:
                    cur.execute("""
                        INSERT INTO tienda_inventario (tienda_id, producto_id, stock)
                        VALUES (%s, %s, 0)
                        ON CONFLICT (tienda_id, producto_id) DO NOTHING
                    """, (request.tienda_id, pid))

                cur.execute("SELECT producto_id FROM tienda_inventario WHERE tienda_id = %s ORDER BY producto_id ASC", (request.tienda_id,))
                final_ids = [r["producto_id"] for r in cur.fetchall()]

            return tienda_pb2.AsignarProductosResponse(
                exito=True,
                mensaje="Productos asignados a la tienda (stock fijado en 0)",
                tienda_id=request.tienda_id,
                producto_ids=final_ids
            )
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] AsignarProductos: {e}")
            return tienda_pb2.AsignarProductosResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                tienda_id=request.tienda_id,
                producto_ids=[]
            )

    def DesasignarProducto(self, request, context):
        print(f"[gRPC Tiendas] DesasignarProducto -> Tienda ID: {request.tienda_id}, Producto ID: {request.producto_id}")
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("""
                    DELETE FROM tienda_inventario
                    WHERE tienda_id = %s AND producto_id = %s
                    RETURNING producto_id
                """, (request.tienda_id, request.producto_id))
                deleted = cur.fetchone()

            if deleted:
                return tienda_pb2.DesasignarProductoResponse(
                    exito=True,
                    mensaje=f"Producto {request.producto_id} desasignado de la tienda",
                    tienda_id=request.tienda_id,
                    producto_id=request.producto_id
                )
            return tienda_pb2.DesasignarProductoResponse(
                exito=False,
                mensaje="El producto no estaba asignado a esa tienda",
                tienda_id=request.tienda_id,
                producto_id=request.producto_id
            )
        except Exception as e:
            print(f"[gRPC Tiendas ERROR] DesasignarProducto: {e}")
            return tienda_pb2.DesasignarProductoResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                tienda_id=request.tienda_id,
                producto_id=request.producto_id
            )

    def _dict_to_model(self, t):
        return tienda_pb2.TiendaModel(
            id=t["id"],
            codigo=t["codigo"],
            direccion=t.get("direccion") or "",
            ciudad=t.get("ciudad") or "",
            provincia=t.get("provincia") or "",
            habilitada=bool(t["habilitada"])
        )


def serve():
    inicializar_bd_si_no_existe()
    port = "50053"
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    tienda_pb2_grpc.add_TiendasServiceServicer_to_server(TiendasServiceServicer(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"[INFO] Servidor gRPC de Tiendas corriendo en http://localhost:{port}")
    print("[INFO] Presiona Ctrl+C para detenerlo.\n")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
