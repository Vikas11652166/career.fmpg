/**
 * Recursively converts Mongoose ObjectIds and Date objects into standard JSON-compatible strings.
 * This guarantees that the serialized objects can be safely passed from Server Components/Actions 
 * to Client Components in Next.js without triggering type or "toJSON" serialization exceptions.
 */
export function serializeDoc<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;

  // Handle mongoose ObjectId (by checking constructor name, toHexString presence, or specific properties)
  if (
    obj._bsontype === "ObjectID" || 
    (obj.constructor && obj.constructor.name === "ObjectId") || 
    (typeof obj.toHexString === "function")
  ) {
    return obj.toString() as any;
  }

  // Handle Date instances
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }

  // Handle Arrays recursively
  if (Array.isArray(obj)) {
    return obj.map(serializeDoc) as any;
  }

  // Handle plain objects recursively
  if (typeof obj === "object") {
    // If it is a Mongoose document instance that hasn't been leanned
    const plain = typeof obj.toObject === "function" ? obj.toObject() : obj;
    const res: any = {};
    for (const key in plain) {
      if (Object.prototype.hasOwnProperty.call(plain, key)) {
        res[key] = serializeDoc(plain[key]);
      }
    }
    return res;
  }

  return obj;
}
