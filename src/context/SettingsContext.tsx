import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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
  businessName: "Posh Homewares",
  currency: "NGN",
  currencySymbol: "₦",
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
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [reorderRequests, setReorderRequests] = useState<string[]>([]);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows found'

      if (data) {
        setSettings({
          businessName: data.business_name,
          currency: data.currency,
          currencySymbol: data.currency_symbol,
          taxRate: Number(data.tax_rate),
          notifications: {
            lowStock: data.low_stock_notif,
            lowStockEmail: data.low_stock_email_notif,
            lowStockEmailAddress: data.low_stock_email_address || "",
            dailyReport: data.daily_report,
            weeklyReport: data.weekly_report,
          }
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSettings();

      // Real-time subscription for settings
      const channel = supabase.channel('settings-sync')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'business_settings',
          filter: `user_id=eq.${user.id}`
        }, () => fetchSettings())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchSettings]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...patch };

      // Update Supabase
      if (user) {
        const dbUpdate = {
          user_id: user.id,
          business_name: newSettings.businessName,
          currency: newSettings.currency,
          currency_symbol: newSettings.currencySymbol,
          tax_rate: newSettings.taxRate,
          low_stock_notif: newSettings.notifications.lowStock,
          low_stock_email_notif: newSettings.notifications.lowStockEmail,
          low_stock_email_address: newSettings.notifications.lowStockEmailAddress,
          daily_report: newSettings.notifications.dailyReport,
          weekly_report: newSettings.notifications.weeklyReport,
          updated_at: new Date().toISOString()
        };

        supabase.from('business_settings').upsert(dbUpdate).then(({ error }) => {
          if (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings to cloud");
          }
        });
      }

      return newSettings;
    });
  }, [user]);

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
