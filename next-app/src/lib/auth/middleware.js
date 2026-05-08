import jwt from 'jsonwebtoken';
import { authConfig } from '@/lib/config/authConfig';

export async function verifyAuth(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    return decoded;
  } catch (error) {
    return null;
  }
}
