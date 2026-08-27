/**
 * useClientes — REESCRITO para la API nueva.
 *
 * ANTES (Supabase):
 *   const { data } = await supabase
 *     .from('clientes')
 *     .select('*, vendedores(nombre)')
 *   await supabase.from('clientes').insert(payload)
 *   await supabase.from('clientes').update(payload).eq('id', id)
 *   await supabase.from('clientes').delete().eq('id', id)
 *
 * DESPUES:
 *   await api.get('/clientes')            // mismo shape: cada cliente trae vendedores:{nombre}
 *   await api.post('/clientes', payload)
 *   await api.patch(`/clientes/${id}`, payload)
 *   await api.del(`/clientes/${id}`)
 *
 * El componente que consume este hook NO cambia: recibe el mismo arreglo de
 * clientes con el objeto `vendedores` anidado.
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useClientes(filtrosIniciales = {}) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(filtrosIniciales);

  const fetchClientes = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      // params: { search, tipo, estado, vendedor_id }
      const data = await api.get('/clientes', params);
      setClientes(data);
      return data;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes(filtros);
  }, [fetchClientes, filtros]);

  const getCliente = useCallback((id) => api.get(`/clientes/${id}`), []);

  const createCliente = useCallback(
    async (payload) => {
      const nuevo = await api.post('/clientes', payload);
      await fetchClientes(filtros);
      return nuevo;
    },
    [fetchClientes, filtros],
  );

  const updateCliente = useCallback(
    async (id, payload) => {
      const actualizado = await api.patch(`/clientes/${id}`, payload);
      await fetchClientes(filtros);
      return actualizado;
    },
    [fetchClientes, filtros],
  );

  const deleteCliente = useCallback(
    async (id) => {
      await api.del(`/clientes/${id}`);
      await fetchClientes(filtros);
    },
    [fetchClientes, filtros],
  );

  return {
    clientes,
    loading,
    error,
    filtros,
    setFiltros, // cambiar filtros dispara refetch
    refetch: () => fetchClientes(filtros),
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente,
  };
}
