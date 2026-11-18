import os
import sys
from contextlib import contextmanager
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

# Configuración de conexión por variables de entorno con valores por defecto
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "stockearte_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "admin")

_pool = None

def get_pool():
    """Retorna un pool de conexiones singleton a PostgreSQL."""
    global _pool
    if _pool is None or _pool.closed:
        try:
            _pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
            print(f"[Database] Pool de conexiones establecido exitosamente con '{DB_NAME}' en {DB_HOST}:{DB_PORT}")
        except Exception as e:
            print(f"[Database ERROR] No se pudo inicializar el pool con {DB_NAME}: {e}", file=sys.stderr)
            raise e
    return _pool

@contextmanager
def get_db_connection():
    """Context manager para obtener y devolver una conexión del pool."""
    p = get_pool()
    conn = p.getconn()
    try:
        yield conn
    finally:
        p.putconn(conn)

@contextmanager
def get_db_cursor(commit=False):
    """Context manager para ejecutar sentencias con cursor tipo diccionario."""
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()

def inicializar_bd_si_no_existe():
    """
    Verifica si las tablas principales existen. Si no existen, ejecuta
    el script database/init.sql para crear esquema y semilla inicial.
    """
    try:
        with get_db_cursor(commit=True) as cur:
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'tiendas'
                );
            """)
            resultado = cur.fetchone()
            if not resultado or not resultado['exists']:
                print("[Database] Tablas no encontradas. Ejecutando init.sql para crear esquema y datos semilla...")
                base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
                init_sql_path = os.path.join(base_dir, "database", "init.sql")
                if os.path.exists(init_sql_path):
                    with open(init_sql_path, "r", encoding="utf-8") as f:
                        sql_script = f.read()
                    cur.execute(sql_script)
                    print("[Database] Tablas y datos semilla inicializados con éxito.")
                else:
                    print(f"[Database ADVERTENCIA] No se encontró el archivo {init_sql_path}")
            else:
                print("[Database] Base de datos 'stockearte_db' operativa y verificada.")
    except Exception as e:
        print(f"[Database] Error al verificar inicialización: {e}", file=sys.stderr)
