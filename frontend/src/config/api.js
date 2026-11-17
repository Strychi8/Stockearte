export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Cliente HTTP base para realizar peticiones REST con manejo de cabeceras y errores.
export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(data?.mensaje || `Error HTTP: ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (error) {
    console.error(`[API Config] Error en ${endpoint}:`, error);
    throw error;
  }
}

export default request;
