import { useState, useEffect } from 'react';
import { publicService } from '../services/publicService';

export function usePublicMenu() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = async (q) => {
    // Si el backend no tiene búsqueda pública de ServiceTypes, filtramos localmente o devolvemos vacío
    return [];
  };

  useEffect(() => {
    async function fetchData(isPolling = false) {
      try {
        if (!isPolling) setLoading(true);
        const [settingsData, menuData] = await Promise.all([
          publicService.getSettings(),
          publicService.getMenu().catch(() => []), // fallback if fail
        ]);
        
        setSettings(settingsData);
        
        let structuredMenu = menuData ?? [];
        
        // Si la lista es plana (arreglo de ServiceTypes sin categorias anidadas)
        if (Array.isArray(menuData) && menuData.length > 0 && !menuData[0].products) {
          const premium = menuData.filter(m => m.price > 0);
          const demos = menuData.filter(m => m.price === 0);
          
          structuredMenu = [];
          if (premium.length > 0) {
            structuredMenu.push({ id: 'premium', name: 'Suscripciones IPTV', products: premium });
          }
          if (demos.length > 0) {
            structuredMenu.push({ id: 'demos', name: 'Demos Gratuitas', products: demos });
          }
          
          // Fallback por si los precios vienen todos nulos o algo extraño ocurre
          if (structuredMenu.length === 0) {
             structuredMenu.push({ id: 'all', name: 'Servicios IPTV', products: menuData });
          }
        }

        setCategories(structuredMenu);
      } catch (err) {
        if (!isPolling) setError(err.message);
      } finally {
        if (!isPolling) setLoading(false);
      }
    }

    fetchData();

    // Polling every 15 seconds
    const interval = setInterval(() => fetchData(true), 15000);

    // Refetch immediately when the tab becomes visible again
    const onVisible = () => { if (document.visibilityState === 'visible') fetchData(true); };
    document.addEventListener('visibilitychange', onVisible);

    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  return { settings, categories, loading, error, search, topSellers: [] };
}
