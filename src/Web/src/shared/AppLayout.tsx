import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiUsers,
  FiFileText,
  FiSettings,
  FiBriefcase,
  FiHome,
  FiBell,
  FiMessageSquare,
  FiMoon,
  FiSun,
  FiInfo,
} from "react-icons/fi";
import { useAuth } from "../providers/AuthProvider";
import { defaultPageHeader, PageHeaderConfig, PageHeaderContext } from "./page-header";
import packageInfo from "../../package.json";

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { to: "/", label: "Dashboard", icon: <FiActivity /> },
  { to: "/episodes", label: "Episodios", icon: <FiFileText /> },
  { to: "/patients", label: "Pacientes", icon: <FiUsers /> },
  { to: "/professionals", label: "Profesionales", icon: <FiBriefcase /> },
  { to: "/institutions", label: "Instituciones", icon: <FiHome /> },
  { to: "/settings", label: "Parámetros", icon: <FiSettings /> },
];

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { location } = useRouterState();
  const currentPath = location.pathname;
  const { session, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [headerConfig, setHeaderConfig] = useState<PageHeaderConfig>(defaultPageHeader);
  const appVersion = packageInfo.version ?? "0.0.0";
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const storedPreference = window.localStorage.getItem("vitalminds:dark-mode");
    if (storedPreference !== null) {
      return storedPreference === "true";
    }
    return window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  });

  const updateHeader = useCallback((config: PageHeaderConfig) => {
    setHeaderConfig({
      title: config.title,
      subtitle: config.subtitle,
      highlights: config.highlights ?? [],
    });
  }, []);

  const headerContextValue = useMemo(
    () => ({
      config: headerConfig,
      setConfig: updateHeader,
    }),
    [headerConfig, updateHeader],
  );

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem("vitalminds:dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  return (
    <div className="relative flex min-h-screen bg-background transition-colors duration-300 dark:bg-slate-900">
      <aside
        className={`flex min-h-screen flex-col border-r border-slate-200 bg-white py-8 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 ${
          isSidebarOpen ? "w-72 px-6" : "w-20 px-3"
        }`}
      >
        <div className={`flex items-center ${isSidebarOpen ? "justify-start" : "justify-center"}`}>
          <img
            src={isSidebarOpen ? "/assets/vitalminds-logo.png" : "/assets/vm-compact.png"}
            alt={isSidebarOpen ? "VitalMinds Clinic Administrator" : "VitalMinds VM"}
            className={`logo-brand transition-all ${isSidebarOpen ? "h-12" : "h-7"}`}
          />
        </div>
        <nav className="mt-8 flex-1 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={isSidebarOpen ? undefined : item.label}
              className={`flex items-center rounded-md py-2 text-sm transition ${
                isSidebarOpen ? "gap-3 px-3 justify-start" : "justify-center px-2"
              } ${
                currentPath === item.to
                  ? "bg-primary text-white dark:bg-primary"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/70"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6">
          <div
            className={`flex items-center rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500 transition-colors dark:border-slate-700 dark:bg-slate-700/40 dark:text-slate-300 ${
              isSidebarOpen ? "justify-between" : "flex-col items-center gap-1 text-center"
            }`}
            title={`Versión ${appVersion}`}
          >
            <div className="flex items-center gap-2">
              <FiInfo className="text-base text-slate-400 dark:text-slate-300" />
              {isSidebarOpen && <span>Versión</span>}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-100">{`v${appVersion}`}</span>
          </div>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              title="Notificaciones"
              className={`flex w-full items-center rounded-md border border-slate-200 text-sm text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary ${
                isSidebarOpen ? "justify-between px-4 py-2" : "justify-center p-2"
              }`}
            >
              <div className="flex items-center gap-2">
                <FiBell className="text-lg" />
                {isSidebarOpen && <span>Notificaciones</span>}
              </div>
              {isSidebarOpen && (
                <span className="rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary dark:bg-primary/20">
                  3
                </span>
              )}
            </button>
            <button
              type="button"
              title="Sugerencias"
              className={`flex w-full items-center rounded-md border border-slate-200 text-sm text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary ${
                isSidebarOpen ? "justify-between px-4 py-2" : "justify-center p-2"
              }`}
            >
              <div className="flex items-center gap-2">
                <FiMessageSquare className="text-lg" />
                {isSidebarOpen && <span>Sugerencias</span>}
              </div>
              {isSidebarOpen && (
                <span className="rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-500 dark:bg-slate-600 dark:text-slate-200">
                  Nuevo
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              title="Modo nocturno"
              className={`flex w-full items-center rounded-md border border-slate-200 text-sm text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary ${
                isSidebarOpen ? "justify-between px-4 py-2" : "justify-center p-2"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{isDarkMode ? <FiSun /> : <FiMoon />}</span>
                {isSidebarOpen && <span>{isDarkMode ? "Modo claro" : "Modo nocturno"}</span>}
              </div>
              {isSidebarOpen && (
                <span
                  className={`inline-flex h-5 w-10 items-center rounded-full border transition-colors ${
                    isDarkMode
                      ? "border-primary bg-primary"
                      : "border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-600/60"
                  }`}
                >
                  <span
                    className={`ml-1 inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform transform ${
                      isDarkMode ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
      <button
        type="button"
        onClick={() => setIsSidebarOpen((open) => !open)}
        className="group absolute top-1/2 z-20 flex h-16 w-6 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-r-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        style={{ left: isSidebarOpen ? "288px" : "80px" }}
        aria-label={isSidebarOpen ? "Contraer menú" : "Expandir menú"}
      >
        <span className="sr-only">{isSidebarOpen ? "Contraer menú" : "Expandir menú"}</span>
        <span className="h-10 w-px rounded-full bg-slate-300 transition-colors group-hover:bg-primary dark:bg-slate-500" />
      </button>
      <PageHeaderContext.Provider value={headerContextValue}>
        <main className="flex-1 bg-background p-6 transition-colors duration-300 dark:bg-slate-900 lg:p-10">
          <header className="mb-6 border-b border-slate-200 pb-6 transition-colors dark:border-slate-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {headerConfig.title}
                </h1>
                {headerConfig.subtitle && (
                  <p className="text-sm text-muted dark:text-slate-400">{headerConfig.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-300">
                  {session?.email ?? "Sesión activa"}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-primary underline dark:text-primary dark:hover:text-primary/80"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
            {headerConfig.highlights && headerConfig.highlights.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {headerConfig.highlights.slice(0, 3).map((highlight) => (
                  <div
                    key={highlight.label}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800"
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-muted dark:text-slate-400">
                      {highlight.label}
                    </span>
                    <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {highlight.value}
                    </div>
                    {highlight.helper && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{highlight.helper}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </header>
          {children}
        </main>
      </PageHeaderContext.Provider>
    </div>
  );
};
