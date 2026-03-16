import { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/customerService';
import { useAuthContext } from '../context/AuthContext';

export function useClientes() {
  const { token } = useAuthContext();
  const [clientes, setClientes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // ── Cargar todos los clientes desde la API ─────────────────────────────────
  const fetchClientes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await customerService.getAll(token);
      setClientes(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  // ── Crear o actualizar cliente ─────────────────────────────────────────────
  const saveCliente = useCallback(async (data) => {
    try {
      if (data.id) {
        const updated = await customerService.update(data.id, data, token);
        setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await customerService.create(data, token);
        setClientes((prev) => [created, ...prev]);
      }
    } catch (err) {
      setError(err.message);
      throw err; // re-throw para que el formulario lo maneje
    }
  }, [token]);

  // ── Eliminar cliente ───────────────────────────────────────────────────────
  const deleteCliente = useCallback(async (id) => {
    try {
      await customerService.remove(id, token);
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token]);

  return { clientes, loading, error, saveCliente, deleteCliente, refetch: fetchClientes };
}
