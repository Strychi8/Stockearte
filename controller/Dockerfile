FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de Node.js
COPY controller/package*.json ./controller/
WORKDIR /app/controller
RUN npm install --omit=dev

# Copiar definiciones proto y código fuente del controlador
WORKDIR /app
COPY proto/ ./proto/
COPY controller/ ./controller/

WORKDIR /app/controller

EXPOSE 3000

ENV PORT=3000

CMD ["node", "src/index.js"]
