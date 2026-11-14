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

# Base de datos simulada en memoria para pruebas
TIENDAS_DB = [
    {
        "id": 1,
        "codigo": "SUC-PALERMO-01",
        "direccion": "Av. Santa Fe 3200",
        "ciudad": "CABA",
        "provincia": "Buenos Aires",
        "habilitada": True,
        "usuario_ids": [2],
        "producto_ids": [1, 2]
    },
    {
        "id": 2,
        "codigo": "SUC-CORDOBA-01",
        "direccion": "Peatonal 9 de Julio 150",
        "ciudad": "Córdoba",
        "provincia": "Córdoba",
        "habilitada": True,
        "usuario_ids": [],
        "producto_ids": [1]
    },
    {
        "id": 3,
        "codigo": "SUC-ROSARIO-01",
        "direccion": "Calle Córdoba 1020",
        "ciudad": "Rosario",
        "provincia": "Santa Fe",
        "habilitada": False,
        "usuario_ids": [],
        "producto_ids": []
    }
]


class TiendasServiceServicer(tienda_pb2_grpc.TiendasServiceServicer):
    """Implementación completa en memoria para el servicio gRPC de Tiendas."""

    def CrearTienda(self, request, context):
        print(f"[gRPC Tiendas] CrearTienda -> Código: '{request.codigo}'")
        codigo_limpio = request.codigo.strip()

        if not codigo_limpio:
            return tienda_pb2.CrearTiendaResponse(
                exito=False,
                mensaje="El código de tienda no puede estar vacío",
                tienda=None
            )

        # Validar unicidad del código alfanumérico elegido
        if any(t["codigo"].lower() == codigo_limpio.lower() for t in TIENDAS_DB):
            return tienda_pb2.CrearTiendaResponse(
                exito=False,
                mensaje=f"Ya existe una tienda con el código '{codigo_limpio}'",
                tienda=None
            )

        nuevo_id = max(t["id"] for t in TIENDAS_DB) + 1 if TIENDAS_DB else 1

        nueva_tienda = {
            "id": nuevo_id,
            "codigo": codigo_limpio,
            "direccion": request.direccion.strip(),
            "ciudad": request.ciudad.strip(),
            "provincia": request.provincia.strip(),
            "habilitada": request.habilitada,
            "usuario_ids": [],
            "producto_ids": []
        }
        TIENDAS_DB.append(nueva_tienda)

        return tienda_pb2.CrearTiendaResponse(
            exito=True,
            mensaje=f"Tienda '{codigo_limpio}' creada exitosamente",
            tienda=self._dict_to_model(nueva_tienda)
        )

    def ObtenerTienda(self, request, context):
        print(f"[gRPC Tiendas] ObtenerTienda -> ID: {request.id if request.HasField('id') else 'N/A'}, Código: '{request.codigo if request.HasField('codigo') else 'N/A'}'")
        tienda = None

        if request.HasField("id") and request.id > 0:
            tienda = next((t for t in TIENDAS_DB if t["id"] == request.id), None)
        elif request.HasField("codigo") and request.codigo:
            codigo_buscado = request.codigo.strip().lower()
            tienda = next((t for t in TIENDAS_DB if t["codigo"].lower() == codigo_buscado), None)

        if tienda:
            return tienda_pb2.ObtenerTiendaResponse(
                exito=True,
                mensaje="Tienda encontrada",
                tienda=self._dict_to_model(tienda),
                usuario_ids=tienda.get("usuario_ids", []),
                producto_ids=tienda.get("producto_ids", [])
            )

        return tienda_pb2.ObtenerTiendaResponse(
            exito=False,
            mensaje="Tienda no encontrada",
            tienda=None,
            usuario_ids=[],
            producto_ids=[]
        )

    def ModificarTienda(self, request, context):
        print(f"[gRPC Tiendas] ModificarTienda -> ID: {request.id}")
        tienda = next((t for t in TIENDAS_DB if t["id"] == request.id), None)

        if not tienda:
            return tienda_pb2.ModificarTiendaResponse(
                exito=False,
                mensaje=f"Tienda con ID {request.id} no encontrada",
                tienda=None
            )

        codigo_limpio = request.codigo.strip()
        if not codigo_limpio:
            return tienda_pb2.ModificarTiendaResponse(
                exito=False,
                mensaje="El código de tienda no puede estar vacío",
                tienda=None
            )

        # Validar que no se colisione con el código de otra tienda existente
        if any(t["id"] != request.id and t["codigo"].lower() == codigo_limpio.lower() for t in TIENDAS_DB):
            return tienda_pb2.ModificarTiendaResponse(
                exito=False,
                mensaje=f"El código '{codigo_limpio}' ya pertenece a otra tienda",
                tienda=None
            )

        tienda["codigo"] = codigo_limpio
        tienda["direccion"] = request.direccion.strip()
        tienda["ciudad"] = request.ciudad.strip()
        tienda["provincia"] = request.provincia.strip()
        tienda["habilitada"] = request.habilitada

        return tienda_pb2.ModificarTiendaResponse(
            exito=True,
            mensaje="Tienda modificada correctamente",
            tienda=self._dict_to_model(tienda)
        )

    def EliminarTienda(self, request, context):
        print(f"[gRPC Tiendas] EliminarTienda -> ID: {request.id}")
        global TIENDAS_DB
        inicial = len(TIENDAS_DB)
        TIENDAS_DB = [t for t in TIENDAS_DB if t["id"] != request.id]

        if len(TIENDAS_DB) < inicial:
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

    def CambiarEstadoTienda(self, request, context):
        print(f"[gRPC Tiendas] CambiarEstadoTienda -> ID: {request.id}, Habilitada: {request.habilitada}")
        tienda = next((t for t in TIENDAS_DB if t["id"] == request.id), None)

        if not tienda:
            return tienda_pb2.CambiarEstadoTiendaResponse(
                exito=False,
                mensaje=f"Tienda con ID {request.id} no encontrada",
                tienda=None
            )

        tienda["habilitada"] = request.habilitada
        estado_texto = "habilitada" if request.habilitada else "inhabilitada"

        return tienda_pb2.CambiarEstadoTiendaResponse(
            exito=True,
            mensaje=f"Estado de la tienda '{tienda['codigo']}' actualizado a {estado_texto}",
            tienda=self._dict_to_model(tienda)
        )

    def BuscarTiendas(self, request, context):
        print(f"[gRPC Tiendas] BuscarTiendas -> Filtro Código: '{request.filtro_codigo}', Filtro Habilitada: {request.filtro_habilitada if request.HasField('filtro_habilitada') else 'Todos'}")
        resultados = []

        filtro_cod = request.filtro_codigo.strip().lower() if request.filtro_codigo else ""

        for t in TIENDAS_DB:
            if filtro_cod and filtro_cod not in t["codigo"].lower():
                continue

            if request.HasField("filtro_habilitada") and t["habilitada"] != request.filtro_habilitada:
                continue

            resultados.append(tienda_pb2.TiendaItem(
                id=t["id"],
                codigo=t["codigo"],
                habilitada=t["habilitada"],
                ciudad=t["ciudad"],
                provincia=t["provincia"]
            ))

        return tienda_pb2.BuscarTiendasResponse(tiendas=resultados)

    def AsignarUsuarios(self, request, context):
        print(f"[gRPC Tiendas] AsignarUsuarios -> Tienda ID: {request.tienda_id}, Usuarios: {list(request.usuario_ids)}")
        tienda = next((t for t in TIENDAS_DB if t["id"] == request.tienda_id), None)

        if not tienda:
            return tienda_pb2.AsignarUsuariosResponse(
                exito=False,
                mensaje=f"Tienda con ID {request.tienda_id} no encontrada",
                tienda_id=request.tienda_id,
                usuario_ids=[]
            )

        if "usuario_ids" not in tienda:
            tienda["usuario_ids"] = []

        for uid in request.usuario_ids:
            if uid not in tienda["usuario_ids"]:
                tienda["usuario_ids"].append(uid)

        return tienda_pb2.AsignarUsuariosResponse(
            exito=True,
            mensaje="Usuarios asignados correctamente",
            tienda_id=request.tienda_id,
            usuario_ids=tienda["usuario_ids"]
        )

    def DesasignarUsuario(self, request, context):
        print(f"[gRPC Tiendas] DesasignarUsuario -> Tienda ID: {request.tienda_id}, Usuario ID: {request.usuario_id}")
        tienda = next((t for t in TIENDAS_DB if t["id"] == request.tienda_id), None)

        if not tienda:
            return tienda_pb2.DesasignarUsuarioResponse(
                exito=False,
                mensaje=f"Tienda con ID {request.tienda_id} no encontrada",
                tienda_id=request.tienda_id,
                usuario_id=request.usuario_id
            )

        if "usuario_ids" in tienda and request.usuario_id in tienda["usuario_ids"]:
            tienda["usuario_ids"].remove(request.usuario_id)

        return tienda_pb2.DesasignarUsuarioResponse(
            exito=True,
            mensaje="Usuario desasignado correctamente",
            tienda_id=request.tienda_id,
            usuario_id=request.usuario_id
        )

    def AsignarProductos(self, request, context):
        print(f"[gRPC Tiendas] AsignarProductos -> Tienda ID: {request.tienda_id}, Productos: {list(request.producto_ids)}")
        tienda = next((t for t in TIENDAS_DB if t["id"] == request.tienda_id), None)

        if not tienda:
            return tienda_pb2.AsignarProductosResponse(
                exito=False,
                mensaje=f"Tienda con ID {request.tienda_id} no encontrada",
                tienda_id=request.tienda_id,
                producto_ids=[]
            )

        if "producto_ids" not in tienda:
            tienda["producto_ids"] = []

        for pid in request.producto_ids:
            if pid not in tienda["producto_ids"]:
                tienda["producto_ids"].append(pid)

        return tienda_pb2.AsignarProductosResponse(
            exito=True,
            mensaje="Productos asignados correctamente a la tienda",
            tienda_id=request.tienda_id,
            producto_ids=tienda["producto_ids"]
        )

    def DesasignarProducto(self, request, context):
        print(f"[gRPC Tiendas] DesasignarProducto -> Tienda ID: {request.tienda_id}, Producto ID: {request.producto_id}")
        tienda = next((t for t in TIENDAS_DB if t["id"] == request.tienda_id), None)

        if not tienda:
            return tienda_pb2.DesasignarProductoResponse(
                exito=False,
                mensaje=f"Tienda con ID {request.tienda_id} no encontrada",
                tienda_id=request.tienda_id,
                producto_id=request.producto_id
            )

        if "producto_ids" in tienda and request.producto_id in tienda["producto_ids"]:
            tienda["producto_ids"].remove(request.producto_id)

        return tienda_pb2.DesasignarProductoResponse(
            exito=True,
            mensaje="Producto desasignado correctamente de la tienda",
            tienda_id=request.tienda_id,
            producto_id=request.producto_id
        )

    def _dict_to_model(self, t):
        return tienda_pb2.TiendaModel(
            id=t["id"],
            codigo=t["codigo"],
            direccion=t["direccion"],
            ciudad=t["ciudad"],
            provincia=t["provincia"],
            habilitada=t["habilitada"]
        )


def serve():
    port = os.environ.get("PORT", "50053")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    tienda_pb2_grpc.add_TiendasServiceServicer_to_server(TiendasServiceServicer(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"[INFO] Servidor gRPC de Tiendas corriendo en http://localhost:{port}")
    print("[INFO] Presiona Ctrl+C para detenerlo.\n")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
