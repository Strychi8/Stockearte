"""
Script para ejecutar la semilla inicial en PostgreSQL (5 tiendas, 5 usuarios, 5 productos con stock).
Uso:
    python database/seed.py
"""
import os
import sys

# Agregar la raíz del proyecto al path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from services.common.database import (
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
)

def asegurar_base_datos():
    """Crea la base de datos si no existe."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'")
        if not cur.fetchone():
            print(f"[Seed] Creando base de datos '{DB_NAME}'...")
            cur.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"[Seed] Base de datos '{DB_NAME}' creada con éxito.")
        else:
            print(f"[Seed] Base de datos '{DB_NAME}' ya existe.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[Seed ERROR] No se pudo verificar la base de datos: {e}")
        sys.exit(1)

def ejecutar_semilla():
    """Ejecuta init.sql contra la base de datos."""
    asegurar_base_datos()
    
    init_sql_path = os.path.join(BASE_DIR, "database", "init.sql")
    if not os.path.exists(init_sql_path):
        print(f"[Seed ERROR] No se encontró el archivo: {init_sql_path}")
        sys.exit(1)

    with open(init_sql_path, "r", encoding="utf-8") as f:
        sql = f.read()

    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )
        conn.autocommit = True
        cur = conn.cursor()
        print(f"[Seed] Ejecutando {init_sql_path} en '{DB_NAME}'...")
        cur.execute(sql)
        
        # Consultar conteos para verificar
        cur.execute("SELECT COUNT(*) FROM tiendas")
        tiendas_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM usuarios")
        usuarios_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM productos")
        productos_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM tienda_inventario")
        stock_count = cur.fetchone()[0]

        print("=======================================================")
        print("[EXITO] SEMILLA CARGADA CORRECTAMENTE EN POSTGRESQL")
        print(f" - Tiendas registradas:   {tiendas_count}")
        print(f" - Usuarios registrados:  {usuarios_count}")
        print(f" - Productos en catálogo: {productos_count}")
        print(f" - Asignaciones de stock: {stock_count}")
        print("=======================================================")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"[Seed ERROR] Falló la ejecución de la semilla: {e}")
        sys.exit(1)

if __name__ == "__main__":
    ejecutar_semilla()
