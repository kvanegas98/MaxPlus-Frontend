import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function fmtCRD(n) {
  return new Intl.NumberFormat('es-NI', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(n ?? 0);
}

/**
 * Validates if a given transaction date is within the last 24 hours 
 * based on Nicaragua's timezone (America/Managua).
 * 
 * @param {string|Date} dateIso El string ISO o Date de la transacción.
 * @returns {boolean} True si está dentro de las últimas 24 horas.
 */
export function canBeVoided(dateIso) {
  if (!dateIso) return false;
  
  try {
    const txDate = new Date(dateIso);
    if (isNaN(txDate.getTime())) return false;

    // Obtener la fecha y hora actual en la zona horaria de Nicaragua
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Managua',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(new Date());
    const dt = {};
    parts.forEach(p => { if (p.type !== 'literal') dt[p.type] = parseInt(p.value, 10); });
    
    // Crear objeto Date representando la hora actual en Nicaragua
    const nowNicaragua = new Date(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute, dt.second);
    
    // Convertir la fecha de la transacción a la zona horaria de Nicaragua
    const txParts = formatter.formatToParts(txDate);
    const txDt = {};
    txParts.forEach(p => { if (p.type !== 'literal') txDt[p.type] = parseInt(p.value, 10); });
    const txNicaragua = new Date(txDt.year, txDt.month - 1, txDt.day, txDt.hour, txDt.minute, txDt.second);

    // Calcular diferencia en milisegundos
    const diffMs = nowNicaragua.getTime() - txNicaragua.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours >= 0 && diffHours <= 24;
  } catch (error) {
    console.error("Error validando tiempo de anulación:", error);
    return false;
  }
}
