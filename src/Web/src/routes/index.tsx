import {
  createRouter,
  createRootRouteWithContext,
  createRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { ReactNode } from "react";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { EpisodesPage } from "../pages/episodes/EpisodesPage";
import { PatientsPage } from "../pages/patients/PatientsPage";
import { ProfessionalsPage } from "../pages/professionals/ProfessionalsPage";
import { InstitutionsPage } from "../pages/institutions/InstitutionsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { AppLayout } from "../shared/AppLayout";

export interface RouterContext {
  isAuthenticated: boolean;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});

const publicLayout = (children: ReactNode) => children;
const privateLayout = (children: ReactNode) => <AppLayout>{children}</AppLayout>;

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: () => publicLayout(<LoginPage />),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => privateLayout(<DashboardPage />),
});

const episodesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/episodes",
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => privateLayout(<EpisodesPage />),
});

const patientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patients",
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => privateLayout(<PatientsPage />),
});

const institutionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/institutions",
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => privateLayout(<InstitutionsPage />),
});

const professionalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/professionals",
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => privateLayout(<ProfessionalsPage />),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => privateLayout(<SettingsPage />),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  episodesRoute,
  patientsRoute,
  professionalsRoute,
  institutionsRoute,
  settingsRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    isAuthenticated: false,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
