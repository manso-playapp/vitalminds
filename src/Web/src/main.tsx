import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./routes";
import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./providers/AuthProvider";
import "./index.css";

const queryClient = new QueryClient();

const RouterWithAuth = () => {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Cargando entorno seguro...
      </div>
    );
  }

  return <RouterProvider router={router} context={{ isAuthenticated }} />;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterWithAuth />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
