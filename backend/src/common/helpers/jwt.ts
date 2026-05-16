import jsonwebtoken, { SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../../env';

export type JwtPayload = {
  sub?: number;
  error?: string;
};

export function signAccessToken(sub: number) {
  const options: SignOptions = {
    expiresIn: env.AUTH_JWT_ACCESS_TOKEN_EXPIRES_IN,
  };
  return jsonwebtoken.sign({ sub }, env.AUTH_JWT_ACCESS_TOKEN_SECRET as Secret, options);
}

export function signRefreshToken(sub: number) {
  const options: SignOptions = {
    expiresIn: env.AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN,
  };
  return jsonwebtoken.sign({ sub }, env.AUTH_JWT_REFRESH_TOKEN_SECRET as Secret, options);
}

export async function isValidAccessToken(token: string): Promise<JwtPayload> {
  return new Promise<JwtPayload>((resolve) => {
    jsonwebtoken.verify(token, env.AUTH_JWT_ACCESS_TOKEN_SECRET, (err, payload) => {
      if (!err && payload && typeof payload !== 'string' && payload.sub) {
        resolve({ sub: Number(payload.sub.toString()) });
      } else {
        resolve({ error: err?.name });
      }
    });
  });
}

export async function isValidRefreshToken(token: string): Promise<JwtPayload | null> {
  return new Promise<JwtPayload | null>((resolve) => {
    jsonwebtoken.verify(token, env.AUTH_JWT_REFRESH_TOKEN_SECRET, (err, payload) => {
      if (!err && payload && typeof payload !== 'string' && payload.sub) {
        resolve({ sub: Number(payload.sub.toString()) });
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Verifica a assinatura do token mas ignora a expiração. Uso restrito a
 * fluxos como logout, onde queremos identificar o dono de um token
 * potencialmente expirado — sem risco de forjamento (a assinatura
 * continua sendo verificada com o segredo).
 */
function verifyIgnoringExpiration(token: string, secret: string): Promise<number | null> {
  return new Promise((resolve) => {
    jsonwebtoken.verify(token, secret, { ignoreExpiration: true }, (err, payload) => {
      if (err || !payload || typeof payload === 'string' || payload.sub === undefined) {
        resolve(null);
        return;
      }
      const sub = Number(String(payload.sub));
      resolve(Number.isFinite(sub) ? sub : null);
    });
  });
}

export function getSubFromAccessTokenAllowExpired(token: string): Promise<number | null> {
  return verifyIgnoringExpiration(token, env.AUTH_JWT_ACCESS_TOKEN_SECRET);
}

export function getSubFromRefreshTokenAllowExpired(token: string): Promise<number | null> {
  return verifyIgnoringExpiration(token, env.AUTH_JWT_REFRESH_TOKEN_SECRET);
}
