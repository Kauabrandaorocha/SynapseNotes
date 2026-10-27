import { Request, Response, CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'accessToken';
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/**
 * Retorna as opções seguras de cookie para tokens de autenticação (JWT).
 * 
 * • HttpOnly: Bloqueia acesso via JavaScript (mitigação total de XSS na credencial).
 * • Secure: Ativado em HTTPS ou ambiente de produção.
 * • SameSite=Lax: Previne CSRF (Cross-Site Request Forgery) permitindo navegação segura.
 * • Max-Age: 7 dias em milissegundos.
 * • Path: '/' (acessível em todas as rotas da aplicação).
 */
export function getAuthCookieOptions(req: Request): CookieOptions {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: Boolean(isHttps),
    sameSite: 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

/**
 * Define o cookie de autenticação HttpOnly na resposta HTTP.
 */
export function setAuthCookie(res: Response, req: Request, token: string): void {
  const options = getAuthCookieOptions(req);
  res.cookie(AUTH_COOKIE_NAME, token, options);
}

/**
 * Limpa o cookie de autenticação HttpOnly ao efetuar logout.
 */
export function clearAuthCookie(res: Response, req: Request): void {
  const options = getAuthCookieOptions(req);
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
  });
}
