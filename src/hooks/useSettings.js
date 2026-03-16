import { useState, useCallback, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

export const SETTINGS_DEFAULTS = {
  businessName:    'MaxPlus IPTV',
  phone:           '',
  description:     '',
  address:         '',
  logoUrl:         '',
  exchangeRateUSD: 36.83,
  demoPhpBaseUrl:  '',
  publicMenuEnabled: true,
  demoAutoApprove:   false,
};

export function useSettings(token) {
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await settingsService.getSettings(token);
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates) => {
    if (!token) return;
    try {
      const next = { ...settings, ...updates };
      setSettings(next); // Optimistic update
      await settingsService.updateSettings(next, token);
    } catch (err) {
      console.error('Failed to save settings', err);
      fetchSettings(); // Rollback
      throw err;
    }
  }, [settings, token, fetchSettings]);

  return { settings, updateSettings, loading, refresh: fetchSettings };
}
