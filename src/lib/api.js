const BASE_URL = import.meta.env.VITE_API_URL;

let on401Callback = null;

export const set401Interceptor = (callback) => {
  on401Callback = callback;
};

async function checkResponse(res) {
  if (res.status === 401) {
    console.warn('[API] Sesión expirada (401).');
    if (on401Callback) on401Callback();
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || err.title || message;
    } catch { /* ignore parse error */ }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Sin token → petición pública (sin advertencia, sin header de autorización)

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
  }

  await checkResponse(res);

  if (res.status === 204) return null;
  return res.json();
}

// multipart/form-data — browser sets Content-Type with boundary automatically
async function requestMultipart(path, { method = 'POST', formData, token } = {}) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: formData });
  } catch {
    throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
  }

  await checkResponse(res);

  if (res.status === 204) return null;
  return res.json();
}

export const apiGet    = (path, token)        => request(path, { token });
export const apiPost   = (path, body, token)  => request(path, { method: 'POST', body, token });
export const apiPut    = (path, body, token)  => request(path, { method: 'PUT',  body, token });
export const apiDelete = (path, bodyOrToken, token) => {
  // Si se llama con 2 argumentos, el segundo es el token
  if (token === undefined) {
    return request(path, { method: 'DELETE', token: bodyOrToken });
  }
  // Si se llama con 3 argumentos, el segundo es el body y el tercero el token
  return request(path, { method: 'DELETE', body: bodyOrToken, token });
};

export const apiPostMultipart = (path, formData, token) =>
  requestMultipart(path, { method: 'POST', formData, token });

export const apiPutMultipart = (path, formData, token) =>
  requestMultipart(path, { method: 'PUT', formData, token });

export const apiGetBlob = async (path, token) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers });
  } catch {
    throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
  }

  await checkResponse(res);

  const contentDisposition = res.headers.get('Content-Disposition');
  let filename = 'documento.pdf';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"']).*?\2|[^;\n]*)/);
    if (match != null && match[1]) {
      filename = match[1].replace(/['"]/g, '');
    }
  }

  const blob = await res.blob();
  return { blob, filename };
};
