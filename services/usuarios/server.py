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

import usuario_pb2
import usuario_pb2_grpc
from services.common.database import get_db_cursor, inicializar_bd_si_no_existe


class UsuariosServiceServicer(usuario_pb2_grpc.UsuariosServiceServicer):
    """Implementación de UsuariosService con persistencia real en PostgreSQL."""

    def Autenticar(self, request, context):
        print(f"[gRPC Usuarios] Autenticar -> Usuario: '{request.nombre_usuario}'")
        try:
            with get_db_cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.nombre_usuario, u.contrasenia, u.nombre, u.apellido,
                           u.habilitado, u.tienda_id, u.rol,
                           COALESCE(t.codigo, 'Casa Central') as codigo_tienda,
                           COALESCE(t.habilitada, TRUE) as tienda_habilitada
                    FROM usuarios u
                    LEFT JOIN tiendas t ON u.tienda_id = t.id
                    WHERE u.nombre_usuario = %s AND u.contrasenia = %s
                """, (request.nombre_usuario.strip(), request.contrasenia.strip()))
                usuario = cur.fetchone()

            if not usuario:
                return usuario_pb2.AutenticarResponse(
                    exito=False,
                    mensaje="Nombre de usuario o contraseña incorrectos",
                    usuario=None
                )

            if not usuario["habilitado"]:
                return usuario_pb2.AutenticarResponse(
                    exito=False,
                    mensaje="El usuario se encuentra inhabilitado para operar",
                    usuario=None
                )

            return usuario_pb2.AutenticarResponse(
                exito=True,
                mensaje="Autenticación exitosa",
                usuario=self._dict_to_model(usuario)
            )
        except Exception as e:
            print(f"[gRPC Usuarios ERROR] Autenticar: {e}")
            return usuario_pb2.AutenticarResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                usuario=None
            )

    def CrearUsuario(self, request, context):
        print(f"[gRPC Usuarios] CrearUsuario -> Usuario: '{request.nombre_usuario}'")
        nombre_usuario_limpio = request.nombre_usuario.strip()

        if not nombre_usuario_limpio:
            return usuario_pb2.CrearUsuarioResponse(
                exito=False,
                mensaje="El nombre de usuario no puede estar vacío",
                usuario=None
            )

        try:
            with get_db_cursor(commit=True) as cur:
                # Regla de negocio: El nombre de usuario debe ser unívoco
                cur.execute("SELECT 1 FROM usuarios WHERE LOWER(nombre_usuario) = LOWER(%s)", (nombre_usuario_limpio,))
                if cur.fetchone():
                    return usuario_pb2.CrearUsuarioResponse(
                        exito=False,
                        mensaje=f"El nombre de usuario '{nombre_usuario_limpio}' ya está registrado",
                        usuario=None
                    )

                tiene_tienda = request.HasField("tienda_id") and request.tienda_id > 0
                tienda_id = request.tienda_id if tiene_tienda else None
                rol = "TIENDA" if tienda_id else "CASA_CENTRAL"

                cur.execute("""
                    INSERT INTO usuarios (nombre_usuario, contrasenia, nombre, apellido, habilitado, tienda_id, rol)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, nombre_usuario, nombre, apellido, habilitado, tienda_id, rol
                """, (
                    nombre_usuario_limpio,
                    request.contrasenia.strip(),
                    request.nombre.strip(),
                    request.apellido.strip(),
                    request.habilitado,
                    tienda_id,
                    rol
                ))
                nuevo = cur.fetchone()

                # Obtener código y estado de tienda
                codigo_tienda = "Casa Central"
                tienda_habilitada = True
                if tienda_id:
                    cur.execute("SELECT codigo, habilitada FROM tiendas WHERE id = %s", (tienda_id,))
                    t_row = cur.fetchone()
                    if t_row:
                        codigo_tienda = t_row["codigo"]
                        tienda_habilitada = bool(t_row["habilitada"])
                nuevo["codigo_tienda"] = codigo_tienda
                nuevo["tienda_habilitada"] = tienda_habilitada

            return usuario_pb2.CrearUsuarioResponse(
                exito=True,
                mensaje=f"Usuario '{nombre_usuario_limpio}' creado exitosamente",
                usuario=self._dict_to_model(nuevo)
            )
        except Exception as e:
            print(f"[gRPC Usuarios ERROR] CrearUsuario: {e}")
            return usuario_pb2.CrearUsuarioResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                usuario=None
            )

    def ObtenerUsuario(self, request, context):
        print(f"[gRPC Usuarios] ObtenerUsuario -> ID: {request.id}")
        try:
            with get_db_cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.nombre_usuario, u.nombre, u.apellido, u.habilitado,
                           u.tienda_id, u.rol,
                           COALESCE(t.codigo, 'Casa Central') as codigo_tienda,
                           COALESCE(t.habilitada, TRUE) as tienda_habilitada
                    FROM usuarios u
                    LEFT JOIN tiendas t ON u.tienda_id = t.id
                    WHERE u.id = %s
                """, (request.id,))
                usuario = cur.fetchone()

            if usuario:
                return usuario_pb2.ObtenerUsuarioResponse(
                    exito=True,
                    mensaje="Usuario encontrado",
                    usuario=self._dict_to_model(usuario)
                )
            return usuario_pb2.ObtenerUsuarioResponse(
                exito=False,
                mensaje=f"Usuario con ID {request.id} no encontrado",
                usuario=None
            )
        except Exception as e:
            print(f"[gRPC Usuarios ERROR] ObtenerUsuario: {e}")
            return usuario_pb2.ObtenerUsuarioResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                usuario=None
            )

    def ModificarUsuario(self, request, context):
        print(f"[gRPC Usuarios] ModificarUsuario -> ID: {request.id}")
        nombre_usuario_limpio = request.nombre_usuario.strip()

        if not nombre_usuario_limpio:
            return usuario_pb2.ModificarUsuarioResponse(
                exito=False,
                mensaje="El nombre de usuario no puede estar vacío",
                usuario=None
            )

        try:
            with get_db_cursor(commit=True) as cur:
                # Verificar existencia
                cur.execute("SELECT id FROM usuarios WHERE id = %s", (request.id,))
                if not cur.fetchone():
                    return usuario_pb2.ModificarUsuarioResponse(
                        exito=False,
                        mensaje=f"Usuario con ID {request.id} no encontrado",
                        usuario=None
                    )

                # Validar unicidad del nombre de usuario
                cur.execute("""
                    SELECT id FROM usuarios
                    WHERE LOWER(nombre_usuario) = LOWER(%s) AND id != %s
                """, (nombre_usuario_limpio, request.id))
                if cur.fetchone():
                    return usuario_pb2.ModificarUsuarioResponse(
                        exito=False,
                        mensaje=f"El nombre de usuario '{nombre_usuario_limpio}' ya pertenece a otro usuario",
                        usuario=None
                    )

                tiene_tienda = request.HasField("tienda_id")
                tienda_id = request.tienda_id if (tiene_tienda and request.tienda_id > 0) else None
                rol = "TIENDA" if tienda_id else "CASA_CENTRAL"

                # Si incluye contraseña nueva, actualizarla
                if request.HasField("contrasenia") and request.contrasenia.strip():
                    cur.execute("""
                        UPDATE usuarios
                        SET nombre_usuario = %s, contrasenia = %s, nombre = %s, apellido = %s,
                            habilitado = %s, tienda_id = %s, rol = %s
                        WHERE id = %s
                    """, (
                        nombre_usuario_limpio,
                        request.contrasenia.strip(),
                        request.nombre.strip(),
                        request.apellido.strip(),
                        request.habilitado,
                        tienda_id,
                        rol,
                        request.id
                    ))
                else:
                    cur.execute("""
                        UPDATE usuarios
                        SET nombre_usuario = %s, nombre = %s, apellido = %s,
                            habilitado = %s, tienda_id = %s, rol = %s
                        WHERE id = %s
                    """, (
                        nombre_usuario_limpio,
                        request.nombre.strip(),
                        request.apellido.strip(),
                        request.habilitado,
                        tienda_id,
                        rol,
                        request.id
                    ))

                # Obtener usuario actualizado con código de tienda
                cur.execute("""
                    SELECT u.id, u.nombre_usuario, u.nombre, u.apellido, u.habilitado,
                           u.tienda_id, u.rol,
                           COALESCE(t.codigo, 'Casa Central') as codigo_tienda,
                           COALESCE(t.habilitada, TRUE) as tienda_habilitada
                    FROM usuarios u
                    LEFT JOIN tiendas t ON u.tienda_id = t.id
                    WHERE u.id = %s
                """, (request.id,))
                actualizado = cur.fetchone()

            return usuario_pb2.ModificarUsuarioResponse(
                exito=True,
                mensaje="Usuario modificado correctamente",
                usuario=self._dict_to_model(actualizado)
            )
        except Exception as e:
            print(f"[gRPC Usuarios ERROR] ModificarUsuario: {e}")
            return usuario_pb2.ModificarUsuarioResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                usuario=None
            )

    def EliminarUsuario(self, request, context):
        print(f"[gRPC Usuarios] EliminarUsuario -> ID: {request.id}")
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("DELETE FROM usuarios WHERE id = %s RETURNING id", (request.id,))
                eliminado = cur.fetchone()

            if eliminado:
                return usuario_pb2.EliminarUsuarioResponse(
                    exito=True,
                    mensaje="Usuario eliminado correctamente",
                    id=request.id
                )
            return usuario_pb2.EliminarUsuarioResponse(
                exito=False,
                mensaje="Usuario no encontrado",
                id=request.id
            )
        except Exception as e:
            print(f"[gRPC Usuarios ERROR] EliminarUsuario: {e}")
            return usuario_pb2.EliminarUsuarioResponse(
                exito=False,
                mensaje=f"Error en base de datos: {str(e)}",
                id=request.id
            )

    def BuscarUsuarios(self, request, context):
        print(f"[gRPC Usuarios] BuscarUsuarios -> Filtro: '{request.filtro_nombre_usuario}'")
        try:
            query = """
                SELECT u.id, u.nombre_usuario, u.habilitado,
                       COALESCE(t.codigo, 'Casa Central') as codigo_tienda
                FROM usuarios u
                LEFT JOIN tiendas t ON u.tienda_id = t.id
                WHERE 1=1
            """
            params = []

            if request.filtro_nombre_usuario and request.filtro_nombre_usuario.strip():
                query += " AND LOWER(u.nombre_usuario) LIKE %s"
                params.append(f"%{request.filtro_nombre_usuario.strip().lower()}%")

            if request.HasField("filtro_tienda_id"):
                if request.filtro_tienda_id == 0:
                    query += " AND u.tienda_id IS NULL"
                else:
                    query += " AND u.tienda_id = %s"
                    params.append(request.filtro_tienda_id)

            query += " ORDER BY u.id ASC"

            with get_db_cursor() as cur:
                cur.execute(query, tuple(params))
                rows = cur.fetchall()

            resultados = [
                usuario_pb2.UsuarioItem(
                    id=r["id"],
                    nombre_usuario=r["nombre_usuario"],
                    codigo_tienda=r["codigo_tienda"],
                    habilitado=r["habilitado"]
                )
                for r in rows
            ]
            return usuario_pb2.BuscarUsuariosResponse(usuarios=resultados)
        except Exception as e:
            print(f"[gRPC Usuarios ERROR] BuscarUsuarios: {e}")
            return usuario_pb2.BuscarUsuariosResponse(usuarios=[])

    def ObtenerUsuariosNoAsignados(self, request, context):
        print("[gRPC Usuarios] ObtenerUsuariosNoAsignados")
        try:
            with get_db_cursor() as cur:
                cur.execute("""
                    SELECT id, nombre_usuario, habilitado, 'Casa Central' as codigo_tienda
                    FROM usuarios
                    WHERE tienda_id IS NULL
                    ORDER BY nombre_usuario ASC
                """)
                rows = cur.fetchall()

            libres = [
                usuario_pb2.UsuarioItem(
                    id=r["id"],
                    nombre_usuario=r["nombre_usuario"],
                    codigo_tienda="Casa Central",
                    habilitado=r["habilitado"]
                )
                for r in rows
            ]
            return usuario_pb2.ObtenerUsuariosNoAsignadosResponse(usuarios=libres)
        except Exception as e:
            print(f"[gRPC Usuarios ERROR] ObtenerUsuariosNoAsignados: {e}")
            return usuario_pb2.ObtenerUsuariosNoAsignadosResponse(usuarios=[])

    def ObtenerUsuariosPorTienda(self, request, context):
        print(f"[gRPC Usuarios] ObtenerUsuariosPorTienda -> Tienda ID: {request.tienda_id}")
        try:
            with get_db_cursor() as cur:
                cur.execute("""
                    SELECT u.id, u.nombre_usuario, u.habilitado, t.codigo as codigo_tienda
                    FROM usuarios u
                    JOIN tiendas t ON u.tienda_id = t.id
                    WHERE u.tienda_id = %s
                    ORDER BY u.nombre_usuario ASC
                """, (request.tienda_id,))
                rows = cur.fetchall()

            asignados = [
                usuario_pb2.UsuarioItem(
                    id=r["id"],
                    nombre_usuario=r["nombre_usuario"],
                    codigo_tienda=r["codigo_tienda"],
                    habilitado=r["habilitado"]
                )
                for r in rows
            ]
            return usuario_pb2.ObtenerUsuariosPorTiendaResponse(usuarios=asignados)
        except Exception as e:
            print(f"[gRPC Usuarios ERROR] ObtenerUsuariosPorTienda: {e}")
            return usuario_pb2.ObtenerUsuariosPorTiendaResponse(usuarios=[])

    def _dict_to_model(self, u):
        kwargs = {
            "id": u["id"],
            "nombre_usuario": u["nombre_usuario"],
            "nombre": u.get("nombre") or "",
            "apellido": u.get("apellido") or "",
            "habilitado": bool(u["habilitado"]),
            "tienda_id": u["tienda_id"] if u["tienda_id"] is not None else 0,
            "codigo_tienda": u.get("codigo_tienda") or "Casa Central",
            "rol": u.get("rol") or ("TIENDA" if u.get("tienda_id") else "CASA_CENTRAL")
        }
        if "tienda_habilitada" in u and u["tienda_habilitada"] is not None:
            kwargs["tienda_habilitada"] = bool(u["tienda_habilitada"])
        return usuario_pb2.UsuarioModel(**kwargs)


def serve():
    inicializar_bd_si_no_existe()
    port = "50051"
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    usuario_pb2_grpc.add_UsuariosServiceServicer_to_server(UsuariosServiceServicer(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"[INFO] Servidor gRPC de Usuarios corriendo en http://localhost:{port}")
    print("[INFO] Presiona Ctrl+C para detenerlo.\n")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
