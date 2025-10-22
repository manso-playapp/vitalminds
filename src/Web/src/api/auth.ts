import { apiClient } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  roles: string[];
  institutionId?: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  email: string;
  roles: string[];
  institutionId?: string;
}

export const login = async (credentials: LoginRequest): Promise<AuthSession> => {
  const response = await apiClient.post<{
    ok?: boolean;
    data?: LoginResponse;
    token?: string;
    expiresAt?: string;
    roles?: string[];
    institutionId?: string;
  }>("/auth/login", credentials);

  const payload: LoginResponse | undefined =
    response.data?.data ??
    (response.data?.token
      ? {
          token: response.data.token,
          expiresAt: response.data.expiresAt ?? "",
          roles: response.data.roles ?? [],
          institutionId: response.data.institutionId,
        }
      : (response.data as unknown as LoginResponse));

  if (!payload?.token) {
    throw new Error("Respuesta de autenticación inválida");
  }

  const session: AuthSession = {
    token: payload.token,
    expiresAt: payload.expiresAt ?? new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    email: credentials.email,
    roles: payload.roles ?? [],
    institutionId: payload.institutionId ?? undefined,
  };

  return session;
};
