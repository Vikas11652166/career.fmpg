import * as jose from "jose";

const SECRET_STRING = process.env.JWT_SECRET || "fmpg_careers_portal_default_secret_key_987654321";
const JWT_SECRET = new TextEncoder().encode(SECRET_STRING);

/**
   * Encodes a JSON payload into a secure Signed JWT.
   * Works everywhere, including Edge Middleware.
   */
export async function signJWT(payload: Record<string, any>, expires = "24h"): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(expires)
    .sign(JWT_SECRET);
}

/**
   * Decodes and verifies a JWT token.
   * Returns decoded payload or null if invalid.
   */
export async function verifyJWT(token: string): Promise<Record<string, any> | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    // console.warn("JWT verification failed:", error);
    return null;
  }
}
