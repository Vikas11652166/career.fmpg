const cache = new Map();

export const setCache = (key, value, ttl) => {
  const expires = Date.now() + ttl;
  cache.set(key, { value, expires });
};

export const getCache = (key) => {
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expires) {
    cache.delete(key);
    return null;
  }

  return cached.value;
};