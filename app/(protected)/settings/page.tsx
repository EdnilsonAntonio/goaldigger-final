"use client";

import { useEffect, useState } from "react";
import { useUserId, useUserPlan } from "@/components/providers/UserProvider";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Clock,
  DollarSign,
  Shield,
  CreditCard,
  Download,
  Trash2,
  Save,
  AlertTriangle,
  Database,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserPreferences {
  id: string;
  userId: string;
  pomodoroFocusTime: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  pomodoroFocusBeforeLong: number;
  pomodoroAlarmSound: string;
  pomodoroTickingEnabled: boolean;
  cashFlowDefaultCurrency: string;
  cashFlowNumberFormat: string;
  cashFlowDefaultCategories: string[];
}

const ALARM_SOUNDS = [
  { label: "Kitchen Timer", value: "/audios/alarm sounds/kitchen timer.mp3" },
  { label: "Bell", value: "/audios/alarm sounds/bell.mp3" },
  { label: "Digital", value: "/audios/alarm sounds/digital.mp3" },
  { label: "Birds", value: "/audios/alarm sounds/birds.mp3" },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

const NUMBER_FORMATS = [
  { value: "1,000.00", label: "1,000.00 (US Format)" },
  { value: "1.000,00", label: "1.000,00 (European Format)" },
];

export default function SettingsPage() {
  const userId = useUserId();
  const userPlan = useUserPlan();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Pomodoro preferences
  const [pomodoroFocusTime, setPomodoroFocusTime] = useState(25);
  const [pomodoroShortBreak, setPomodoroShortBreak] = useState(5);
  const [pomodoroLongBreak, setPomodoroLongBreak] = useState(15);
  const [pomodoroFocusBeforeLong, setPomodoroFocusBeforeLong] = useState(4);
  const [pomodoroAlarmSound, setPomodoroAlarmSound] = useState(ALARM_SOUNDS[0].value);
  const [pomodoroTickingEnabled, setPomodoroTickingEnabled] = useState(true);

  // Cash Flow preferences
  const [cashFlowDefaultCurrency, setCashFlowDefaultCurrency] = useState("USD");
  const [cashFlowNumberFormat, setCashFlowNumberFormat] = useState("1,000.00");
  const [cashFlowDefaultCategories, setCashFlowDefaultCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (userId) {
      fetchPreferences();
    }
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/preferences");
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      const data = await response.json();
      const prefs = data.preferences;
      setPreferences(prefs);

      // Set Pomodoro preferences
      setPomodoroFocusTime(prefs.pomodoroFocusTime / 60);
      setPomodoroShortBreak(prefs.pomodoroShortBreak / 60);
      setPomodoroLongBreak(prefs.pomodoroLongBreak / 60);
      setPomodoroFocusBeforeLong(prefs.pomodoroFocusBeforeLong);
      setPomodoroAlarmSound(prefs.pomodoroAlarmSound);
      setPomodoroTickingEnabled(prefs.pomodoroTickingEnabled);

      // Set Cash Flow preferences
      setCashFlowDefaultCurrency(prefs.cashFlowDefaultCurrency);
      setCashFlowNumberFormat(prefs.cashFlowNumberFormat);
      setCashFlowDefaultCategories(prefs.cashFlowDefaultCategories || []);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pomodoroFocusTime: pomodoroFocusTime * 60, // Convert to seconds
          pomodoroShortBreak: pomodoroShortBreak * 60,
          pomodoroLongBreak: pomodoroLongBreak * 60,
          pomodoroFocusBeforeLong,
          pomodoroAlarmSound,
          pomodoroTickingEnabled,
          cashFlowDefaultCurrency,
          cashFlowNumberFormat,
          cashFlowDefaultCategories,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save preferences");
      }

      toast.success("Preferences saved successfully!");
      setHasChanges(false);
      await fetchPreferences();
      
      // Notificar outras páginas para recarregar preferências
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("preferencesUpdated"));
      }
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info("Preparing your data export...");
      const response = await fetch("/api/account/export");
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `goaldigger-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete account");
      }

      toast.success("Account deleted successfully. Redirecting...");
      // Redirect to logout and then home
      setTimeout(() => {
        window.location.href = "/api/auth/logout";
      }, 2000);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !cashFlowDefaultCategories.includes(newCategory.trim())) {
      setCashFlowDefaultCategories([...cashFlowDefaultCategories, newCategory.trim()]);
      setNewCategory("");
      setHasChanges(true);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCashFlowDefaultCategories(cashFlowDefaultCategories.filter((c) => c !== category));
    setHasChanges(true);
  };

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      toast.success("Cache cleared successfully!");
    }
  };

  const handleManageSubscription = async () => {
    try {
      toast.info("Redirecting to Stripe...");
      const response = await fetch("/api/billing/portal?type=subscription");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create portal session");
      }
      const data = await response.json();
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      toast.error(error.message || "Failed to redirect to Stripe");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-neutral-400">Manage your application preferences and account settings</p>
        </div>
        {hasChanges && (
          <Button onClick={handleSavePreferences} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Pomodoro Preferences */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Pomodoro Preferences</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Focus Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={pomodoroFocusTime}
                  onChange={(e) => {
                    setPomodoroFocusTime(Number(e.target.value));
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Short Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={pomodoroShortBreak}
                  onChange={(e) => {
                    setPomodoroShortBreak(Number(e.target.value));
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Long Break (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={pomodoroLongBreak}
                  onChange={(e) => {
                    setPomodoroLongBreak(Number(e.target.value));
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Focus Sessions Before Long Break
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={pomodoroFocusBeforeLong}
                onChange={(e) => {
                  setPomodoroFocusBeforeLong(Number(e.target.value));
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Alarm Sound
              </label>
              <select
                value={pomodoroAlarmSound}
                onChange={(e) => {
                  setPomodoroAlarmSound(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ALARM_SOUNDS.map((sound) => (
                  <option key={sound.value} value={sound.value}>
                    {sound.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="tickingEnabled"
                checked={pomodoroTickingEnabled}
                onChange={(e) => {
                  setPomodoroTickingEnabled(e.target.checked);
                  setHasChanges(true);
                }}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-900 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="tickingEnabled" className="text-sm text-neutral-300">
                Enable ticking sound during timer
              </label>
            </div>
          </div>
        </div>

        {/* Cash Flow Preferences */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Cash Flow Preferences</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Default Currency
              </label>
              <select
                value={cashFlowDefaultCurrency}
                onChange={(e) => {
                  setCashFlowDefaultCurrency(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Number Format
              </label>
              <select
                value={cashFlowNumberFormat}
                onChange={(e) => {
                  setCashFlowNumberFormat(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NUMBER_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Default Categories
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddCategory();
                    }
                  }}
                  placeholder="Add a category"
                  className="flex-1 px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleAddCategory} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cashFlowDefaultCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-600 rounded-lg text-sm text-white"
                  >
                    {category}
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Account & Subscription */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Account & Subscription</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
              <div className="mb-4">
                <p className="text-sm text-neutral-400">Current Plan</p>
                <p className="text-lg font-semibold text-white capitalize">{userPlan} Plan</p>
              </div>
              <Button variant="outline" onClick={handleManageSubscription} className="w-full sm:w-auto">
                Manage Subscription & Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Privacy & Security</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
              <h3 className="text-sm font-medium text-white mb-2">Export Your Data</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Download all your data in JSON format. This includes all your tasks, goals,
                transactions, and other information.
              </p>
              <Button onClick={handleExportData} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            </div>
            <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
              <h3 className="text-sm font-medium text-red-400 mb-2">Delete Account</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                      Delete Account
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-300">
                      Are you absolutely sure? This will permanently delete your account and all
                      your data including tasks, goals, transactions, and preferences. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Data & Storage */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Data & Storage</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700">
              <h3 className="text-sm font-medium text-white mb-2">Clear Cache</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Clear all cached data stored in your browser. This will not affect your account
                data.
              </p>
              <Button onClick={handleClearCache} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Clear Cache
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

