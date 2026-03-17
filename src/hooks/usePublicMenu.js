import { useState, useEffect } from 'react';
import { publicService } from '../services/publicService';

export function usePublicMenu() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = async () => [];

  useEffect(() => {
    async function fetchData(isPolling = false) {
      try {
        if (!isPolling) setLoading(true);
        const [settingsData, menuData] = await Promise.all([
          publicService.getSettings(),
          publicService.getMenuAgrupado().catch(() => []),
        ]);

        setSettings(settingsData);

        // El endpoint agrupado devuelve: [{ categoriaId, categoriaNombre, categoriaColor, servicios }]
        const agrupado = Array.isArray(menuData) ? menuData : [];
        const structured = agrupado.map((grupo) => ({
          id:       grupo.categoriaId,
          name:     grupo.categoriaNombre,
          color:    grupo.categoriaColor,
          products: grupo.servicios ?? [],
        }));

        setCategories(structured);
      } catch (err) {
        if (!isPolling) setError(err.message);
      } finally {
        if (!isPolling) setLoading(false);
      }
    }

    fetchData();

    const interval = setInterval(() => fetchData(true), 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchData(true); };
    document.addEventListener('visibilitychange', onVisible);

    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  return { settings, categories, loading, error, search, topSellers: [] };
}
