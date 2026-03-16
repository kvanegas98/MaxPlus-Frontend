import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('gema-theme');
      if (saved) return saved === 'dark';
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('gema-theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('gema-theme', 'light');
    }
  }, [isDark]);

  const toggle = () => setIsDark((v) => !v);
  return { isDark, toggle };
}
