const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Stockearte API',
    version: '1.0.0',
    description: 'API REST que comunica la interfaz de usuario con los microservicios gRPC de Usuarios, Tiendas y Productos.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local de Desarrollo'
    }
  ],
  tags: [
    { name: 'Autenticación', description: 'Endpoints para inicio de sesión' },
    { name: 'Usuarios', description: 'Gestión de usuarios y asignaciones' },
    { name: 'Productos', description: 'Catálogo de artículos y control descentralizado de stock' },
    { name: 'Tiendas', description: 'Gestión de tiendas físicas, estado y asignación de catálogo' }
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Autenticar usuario en la plataforma',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre_usuario', 'contrasenia'],
                properties: {
                  nombre_usuario: { type: 'string', example: 'admin' },
                  contrasenia: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Autenticación exitosa' },
          401: { description: 'Credenciales inválidas' }
        }
      }
    },
    '/api/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Buscar y listar usuarios con filtros',
        parameters: [
          { name: 'nombre_usuario', in: 'query', schema: { type: 'string' } },
          { name: 'tienda_id', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Lista de usuarios' }
        }
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear un nuevo usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre_usuario', 'contrasenia', 'nombre', 'apellido'],
                properties: {
                  nombre_usuario: { type: 'string', example: 'vendedor_palermo' },
                  contrasenia: { type: 'string', example: 'clave123' },
                  nombre: { type: 'string', example: 'Lucas' },
                  apellido: { type: 'string', example: 'Gómez' },
                  habilitado: { type: 'boolean', example: true },
                  tienda_id: { type: 'integer', example: 1 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Usuario creado exitosamente' }
        }
      }
    },
    '/api/usuarios/no-asignados': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios no asignados a tiendas (Casa Central o libres)',
        responses: {
          200: { description: 'Lista de usuarios disponibles' }
        }
      }
    },
    '/api/usuarios/tienda/{tienda_id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios pertenecientes a una tienda',
        parameters: [
          { name: 'tienda_id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Lista de usuarios asignados' }
        }
      }
    },
    '/api/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener detalle de un usuario',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Datos del usuario' },
          404: { description: 'Usuario no encontrado' }
        }
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Modificar usuario existente',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre_usuario: { type: 'string', example: 'lucas_g' },
                  contrasenia: { type: 'string', example: 'nueva_clave' },
                  nombre: { type: 'string', example: 'Lucas' },
                  apellido: { type: 'string', example: 'Gómez' },
                  habilitado: { type: 'boolean', example: true },
                  tienda_id: { type: 'integer', example: 1 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Usuario modificado' }
        }
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Eliminar usuario',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Usuario eliminado' }
        }
      }
    },
    '/api/tiendas': {
      get: {
        tags: ['Tiendas'],
        summary: 'Buscar y listar tiendas',
        parameters: [
          { name: 'codigo', in: 'query', schema: { type: 'string' } },
          { name: 'habilitada', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: {
          200: { description: 'Lista de tiendas' }
        }
      },
      post: {
        tags: ['Tiendas'],
        summary: 'Alta de una tienda física',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['codigo'],
                properties: {
                  codigo: { type: 'string', example: 'SUC-QUILMES-01' },
                  direccion: { type: 'string', example: 'Rivadavia 450' },
                  ciudad: { type: 'string', example: 'Quilmes' },
                  provincia: { type: 'string', example: 'Buenos Aires' },
                  habilitada: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Tienda creada' }
        }
      }
    },
    '/api/tiendas/{id}': {
      get: {
        tags: ['Tiendas'],
        summary: 'Obtener detalle de tienda por ID numérico o código',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Detalle de la tienda con usuarios y productos asociados' }
        }
      },
      put: {
        tags: ['Tiendas'],
        summary: 'Modificar datos de una tienda',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['codigo'],
                properties: {
                  codigo: { type: 'string', example: 'SUC-QUILMES-01' },
                  direccion: { type: 'string', example: 'Calle 100' },
                  ciudad: { type: 'string', example: 'Quilmes' },
                  provincia: { type: 'string', example: 'Buenos Aires' },
                  habilitada: { type: 'boolean', example: true }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Tienda modificada' }
        }
      },
      delete: {
        tags: ['Tiendas'],
        summary: 'Eliminar tienda',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Tienda eliminada' }
        }
      }
    },
    '/api/tiendas/{id}/estado': {
      patch: {
        tags: ['Tiendas'],
        summary: 'Cambiar estado habilitada/inhabilitada',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['habilitada'],
                properties: {
                  habilitada: { type: 'boolean', example: false }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Estado actualizado' }
        }
      }
    },
    '/api/tiendas/{id}/usuarios': {
      post: {
        tags: ['Tiendas'],
        summary: 'Asignar usuarios a la tienda',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['usuario_ids'],
                properties: {
                  usuario_ids: { type: 'array', items: { type: 'integer' }, example: [2, 3] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Usuarios asignados' }
        }
      }
    },
    '/api/tiendas/{id}/usuarios/{usuario_id}': {
      delete: {
        tags: ['Tiendas'],
        summary: 'Desasignar usuario de la tienda',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'usuario_id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Usuario desasignado de la tienda' }
        }
      }
    },
    '/api/tiendas/{id}/productos': {
      post: {
        tags: ['Tiendas'],
        summary: 'Asignar productos a la tienda',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['producto_ids'],
                properties: {
                  producto_ids: { type: 'array', items: { type: 'integer' }, example: [1, 2] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Productos asignados' }
        }
      }
    },
    '/api/tiendas/{id}/productos/{producto_id}': {
      delete: {
        tags: ['Tiendas'],
        summary: 'Desasignar producto de la tienda',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'producto_id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Producto desasignado' }
        }
      }
    },
    '/api/productos': {
      get: {
        tags: ['Productos'],
        summary: 'Buscar y listar productos con filtros',
        parameters: [
          { name: 'nombre', in: 'query', schema: { type: 'string' } },
          { name: 'codigo', in: 'query', schema: { type: 'string' } },
          { name: 'talle', in: 'query', schema: { type: 'string' } },
          { name: 'color', in: 'query', schema: { type: 'string' } },
          { name: 'tienda_id_usuario', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Lista de productos' }
        }
      },
      post: {
        tags: ['Productos'],
        summary: 'Crear nuevo producto (código aleatorio 10 chars y stock 0)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'talle', 'color'],
                properties: {
                  nombre: { type: 'string', example: 'Chomba Piqué' },
                  talle: { type: 'string', example: 'M' },
                  color: { type: 'string', example: 'Blanco' },
                  foto: { type: 'string', example: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' },
                  tienda_ids: { type: 'array', items: { type: 'integer' }, example: [1, 2] }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Producto creado' }
        }
      }
    },
    '/api/productos/tienda/{tienda_id}': {
      get: {
        tags: ['Productos'],
        summary: 'Listar productos asociados a una tienda',
        parameters: [
          { name: 'tienda_id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Lista de productos de la tienda' }
        }
      }
    },
    '/api/productos/no-asignados/{tienda_id}': {
      get: {
        tags: ['Productos'],
        summary: 'Listar productos del catálogo no asociados aún a la tienda',
        parameters: [
          { name: 'tienda_id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Lista de productos no asignados' }
        }
      }
    },
    '/api/productos/{id}': {
      get: {
        tags: ['Productos'],
        summary: 'Detalle de producto con desglose de stock',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'tienda_id_solicitante', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Detalle del producto y stocks por tienda' }
        }
      },
      put: {
        tags: ['Productos'],
        summary: 'Modificar producto (el código de 10 caracteres permanece inmutable)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'talle', 'color'],
                properties: {
                  nombre: { type: 'string', example: 'Chomba Piqué Premium' },
                  talle: { type: 'string', example: 'M' },
                  color: { type: 'string', example: 'Azul Marino' },
                  foto: { type: 'string', example: '' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Producto modificado' }
        }
      },
      delete: {
        tags: ['Productos'],
        summary: 'Eliminar producto',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Producto eliminado' }
        }
      }
    },
    '/api/productos/{id}/stock': {
      put: {
        tags: ['Productos'],
        summary: 'Modificar stock de producto en una tienda específica',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tienda_id', 'nuevo_stock'],
                properties: {
                  tienda_id: { type: 'integer', example: 1 },
                  nuevo_stock: { type: 'integer', example: 25 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Stock actualizado' }
        }
      }
    }
  }
};

module.exports = {
  swaggerUi,
  swaggerDocument
};
