FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias Python
COPY services/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar definiciones proto, módulo común y el microservicio
COPY proto/ /app/proto/
COPY services/common/ /app/services/common/
COPY services/tiendas/ /app/services/tiendas/

ENV PYTHONPATH=/app:/app/proto
ENV PYTHONUNBUFFERED=1

EXPOSE 50053

CMD ["python", "services/tiendas/server.py"]
