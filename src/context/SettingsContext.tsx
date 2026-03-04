import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Settings {
  businessName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  notifications: {
    lowStock: boolean;
    lowStockEmail: boolean;
    lowStockEmailAddress: string;
    dailyReport: boolean;
    weeklyReport: boolean;
  };
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  dismissed: boolean;
  timestamp: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  lowStockAlerts: LowStockAlert[];
  setLowStockAlerts: React.Dispatch<React.SetStateAction<LowStockAlert[]>>;
  dismissAlert: (productId: string) => void;
  reorderRequests: string[];
  requestReorder: (productId: string) => void;
  clearReorder: (productId: string) => void;
}

const defaultSettings: Settings = {
  businessName: "Arōma",
  currency: "USD",
  currencySymbol: "$",
  taxRate: 8.5,
  notifications: {
    lowStock: true,
    lowStockEmail: false,
    lowStockEmailAddress: "",
    dailyReport: false,
    weeklyReport: true,
  },
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem("aroma-settings");
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [reorderRequests, setReorderRequests] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("aroma-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const dismissAlert = useCallback((productId: string) => {
    setLowStockAlerts(prev =>
      prev.map(a => a.productId === productId ? { ...a, dismissed: true } : a)
    );
  }, []);

  const requestReorder = useCallback((productId: string) => {
    setReorderRequests(prev => prev.includes(productId) ? prev : [...prev, productId]);
  }, []);

  const clearReorder = useCallback((productId: string) => {
    setReorderRequests(prev => prev.filter(id => id !== productId));
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings, updateSettings,
      lowStockAlerts, setLowStockAlerts,
      dismissAlert,
      reorderRequests, requestReorder, clearReorder
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
