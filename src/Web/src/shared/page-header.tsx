import { createContext, useContext } from "react";

export interface PageHighlight {
  label: string;
  value: string;
  helper?: string;
}

export interface PageHeaderConfig {
  title: string;
  subtitle?: string;
  highlights?: PageHighlight[];
}

export interface PageHeaderContextValue {
  config: PageHeaderConfig;
  setConfig: (config: PageHeaderConfig) => void;
}

export const defaultPageHeader: PageHeaderConfig = {
  title: "VitalMinds Clinic",
  subtitle: "Gestión centralizada de salud ocupacional",
  highlights: [],
};

export const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined);

export const usePageHeader = () => {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error("usePageHeader debe utilizarse dentro de un PageHeaderContext.Provider");
  }
  return context;
};
