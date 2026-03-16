import { useState, useEffect, useMemo } from 'react';
import { serviceTypeService } from '../services/serviceTypeService';
import { useAuthContext } from '../context/AuthContext';

const ALL_CAT = { id: 'all', name: 'Todos' };

export function useMenu() {
  const { token } = useAuthContext();
  const [allProducts,      setAllProducts]      = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    serviceTypeService.getAll(token)
      .then(data => setAllProducts(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Derive categories from the plataforma / category field of each service
  const categories = useMemo(() => {
    const seen = new Set();
    const cats = [];
    for (const p of allProducts) {
      const id   = p.plataforma || p.category || 'other';
      const name = p.plataforma || p.category || 'Otros';
      if (!seen.has(id)) { seen.add(id); cats.push({ id, name }); }
    }
    return [ALL_CAT, ...cats];
  }, [allProducts]);

  const products = useMemo(() => {
    if (selectedCategory === 'all') return allProducts;
    return allProducts.filter(p =>
      (p.plataforma || p.category || 'other') === selectedCategory
    );
  }, [allProducts, selectedCategory]);

  return { categories, selectedCategory, setSelectedCategory, products, loading, error };
}
