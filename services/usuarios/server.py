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

# Base de datos simulada en memoria para pruebas
USUARIOS_DB = [
    {
        "id": 1,
        "nombre_usuario": "admin",
        "contrasenia": "admin123",
        "nombre": "",
        "apellido": "",
        "habilitado": True,
        "tienda_id": None,
        "codigo_tienda": "Casa Central",
        "rol": "CASA_CENTRAL"
    },
    {
        "id": 2,
        "nombre_usuario": "AnaG20",
        "contrasenia": "123456",
        "nombre": "Ana",
        "apellido": "García",
        "habilitado": True,
        "tienda_id": 1,
        "codigo_tienda": "SUC-PALERMO-01",
        "rol": "TIENDA"
    },
    {
        "id": 3,
        "nombre_usuario": "Carlitos333",
        "contrasenia": "123456",
        "nombre": "Carlos",
        "apellido": "López",
        "habilitado": True,
        "tienda_id": None,
        "codigo_tienda": "Casa Central",
        "rol": "CASA_CENTRAL"
    }
]

class UsuariosServiceServicer(usuario_pb2_grpc.UsuariosServiceServicer):
    """Implementación completa en memoria para pruebas gRPC desde Postman."""

    def Autenticar(self, request, context):
        print(f"[gRPC] Autenticar -> Usuario: '{request.nombre_usuario}'")
        for u in USUARIOS_DB:
            if u["nombre_usuario"] == request.nombre_usuario and u["contrasenia"] == request.contrasenia:
                if not u.get("habilitado", True):
                    return usuario_pb2.AutenticarResponse(
                        exito=False,
                        mensaje="El usuario se encuentra inhabilitado para operar",
                        usuario=None
                    )
                return usuario_pb2.AutenticarResponse(
                    exito=True,
                    mensaje="Autenticación exitosa",
                    usuario=self._dict_to_model(u)
                )
        return usuario_pb2.AutenticarResponse(
            exito=False,
            mensaje="Nombre de usuario o contraseña incorrectos",
            usuario=None
        )

    def CrearUsuario(self, request, context):
        print(f"[gRPC] CrearUsuario -> Usuario: '{request.nombre_usuario}'")
        nombre_usuario_limpio = request.nombre_usuario.strip()

        if not nombre_usuario_limpio:
            return usuario_pb2.CrearUsuarioResponse(
                exito=False,
                mensaje="El nombre de usuario no puede estar vacío",
                usuario=None
            )

        # Regla de negocio: El nombre de usuario debe ser unívoco en el sistema
        if any(u["nombre_usuario"].lower() == nombre_usuario_limpio.lower() for u in USUARIOS_DB):
            return usuario_pb2.CrearUsuarioResponse(
                exito=False,
                mensaje=f"El nombre de usuario '{nombre_usuario_limpio}' ya está registrado",
                usuario=None
            )

        nuevo_id = max(u["id"] for u in USUARIOS_DB) + 1 if USUARIOS_DB else 1
        tiene_tienda = request.HasField("tienda_id") and request.tienda_id > 0
        tienda_id = request.tienda_id if tiene_tienda else None

        nuevo_usuario = {
            "id": nuevo_id,
            "nombre_usuario": nombre_usuario_limpio,
            "contrasenia": request.contrasenia,
            "nombre": request.nombre.strip(),
            "apellido": request.apellido.strip(),
            "habilitado": request.habilitado,
            "tienda_id": tienda_id,
            "codigo_tienda": f"SUC-{tienda_id:02d}" if tienda_id else "Casa Central",
            "rol": "TIENDA" if tienda_id else "CASA_CENTRAL"
        }
        USUARIOS_DB.append(nuevo_usuario)

        return usuario_pb2.CrearUsuarioResponse(
            exito=True,
            mensaje=f"Usuario '{nombre_usuario_limpio}' creado exitosamente",
            usuario=self._dict_to_model(nuevo_usuario)
        )

    def ObtenerUsuario(self, request, context):
        print(f"[gRPC] ObtenerUsuario -> ID: {request.id}")
        usuario = next((u for u in USUARIOS_DB if u["id"] == request.id), None)
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

    def ModificarUsuario(self, request, context):
        print(f"[gRPC] ModificarUsuario -> ID: {request.id}")
        usuario = next((u for u in USUARIOS_DB if u["id"] == request.id), None)
        if not usuario:
            return usuario_pb2.ModificarUsuarioResponse(
                exito=False,
                mensaje=f"Usuario con ID {request.id} no encontrado",
                usuario=None
            )

        nombre_usuario_limpio = request.nombre_usuario.strip()
        if not nombre_usuario_limpio:
            return usuario_pb2.ModificarUsuarioResponse(
                exito=False,
                mensaje="El nombre de usuario no puede estar vacío",
                usuario=None
            )

        # Regla de negocio: Validar que no pertenezca a otro usuario
        if any(u["id"] != request.id and u["nombre_usuario"].lower() == nombre_usuario_limpio.lower() for u in USUARIOS_DB):
            return usuario_pb2.ModificarUsuarioResponse(
                exito=False,
                mensaje=f"El nombre de usuario '{nombre_usuario_limpio}' ya pertenece a otro usuario",
                usuario=None
            )

        usuario["nombre_usuario"] = nombre_usuario_limpio
        usuario["nombre"] = request.nombre.strip()
        usuario["apellido"] = request.apellido.strip()
        usuario["habilitado"] = request.habilitado
        if request.HasField("contrasenia") and request.contrasenia:
            usuario["contrasenia"] = request.contrasenia
        if request.HasField("tienda_id"):
            usuario["tienda_id"] = request.tienda_id if request.tienda_id > 0 else None
            usuario["codigo_tienda"] = f"SUC-{request.tienda_id:02d}" if usuario["tienda_id"] else "Casa Central"
            usuario["rol"] = "TIENDA" if usuario["tienda_id"] else "CASA_CENTRAL"

        return usuario_pb2.ModificarUsuarioResponse(
            exito=True,
            mensaje="Usuario modificado correctamente",
            usuario=self._dict_to_model(usuario)
        )

    def EliminarUsuario(self, request, context):
        print(f"[gRPC] EliminarUsuario -> ID: {request.id}")
        global USUARIOS_DB
        inicial = len(USUARIOS_DB)
        USUARIOS_DB = [u for u in USUARIOS_DB if u["id"] != request.id]
        if len(USUARIOS_DB) < inicial:
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

    def BuscarUsuarios(self, request, context):
        print(f"[gRPC] BuscarUsuarios -> Filtro: '{request.filtro_nombre_usuario}'")
        resultados = []
        for u in USUARIOS_DB:
            if request.filtro_nombre_usuario and request.filtro_nombre_usuario.lower() not in u["nombre_usuario"].lower():
                continue
            if request.HasField("filtro_tienda_id"):
                if request.filtro_tienda_id == 0:
                    if u["tienda_id"] is not None and u["tienda_id"] > 0:
                        continue
                elif u["tienda_id"] != request.filtro_tienda_id:
                    continue
            resultados.append(usuario_pb2.UsuarioItem(
                id=u["id"],
                nombre_usuario=u["nombre_usuario"],
                codigo_tienda=u["codigo_tienda"] if u["codigo_tienda"] else "Casa Central",
                habilitado=u["habilitado"]
            ))
        return usuario_pb2.BuscarUsuariosResponse(usuarios=resultados)

    def ObtenerUsuariosNoAsignados(self, request, context):
        print("[gRPC] ObtenerUsuariosNoAsignados")
        libres = [
            usuario_pb2.UsuarioItem(
                id=u["id"],
                nombre_usuario=u["nombre_usuario"],
                codigo_tienda="Casa Central",
                habilitado=u["habilitado"]
            )
            for u in USUARIOS_DB if u["tienda_id"] is None
        ]
        return usuario_pb2.ObtenerUsuariosNoAsignadosResponse(usuarios=libres)

    def ObtenerUsuariosPorTienda(self, request, context):
        print(f"[gRPC] ObtenerUsuariosPorTienda -> Tienda ID: {request.tienda_id}")
        asignados = [
            usuario_pb2.UsuarioItem(
                id=u["id"],
                nombre_usuario=u["nombre_usuario"],
                codigo_tienda=u["codigo_tienda"],
                habilitado=u["habilitado"]
            )
            for u in USUARIOS_DB if u["tienda_id"] == request.tienda_id
        ]
        return usuario_pb2.ObtenerUsuariosPorTiendaResponse(usuarios=asignados)

    def _dict_to_model(self, u):
        return usuario_pb2.UsuarioModel(
            id=u["id"],
            nombre_usuario=u["nombre_usuario"],
            nombre=u["nombre"],
            apellido=u["apellido"],
            habilitado=u["habilitado"],
            tienda_id=u["tienda_id"],
            codigo_tienda=u["codigo_tienda"],
            rol=u["rol"]
        )

def serve():
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
