export function inferType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (value instanceof RegExp) return 'regexp';
  
  const baseType = typeof value;
  if (baseType === 'string') {
    const str = value as string;
    if (/^\d+$/.test(str)) return 'number';
    if (/^(true|false)$/i.test(str)) return 'boolean';
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return 'date';
  }
  
  return baseType;
}

export function cast<T>(value: unknown, type: string): T {
  switch (type) {
    case 'string': return String(value) as T;
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) throw new Error(`Cannot cast "${value}" to number`);
      return num as T;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value as T;
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true') return true as T;
        if (lower === 'false') return false as T;
      }
      return Boolean(value) as T;
    }
    case 'array': {
      if (Array.isArray(value)) return value as T;
      if (typeof value === 'string') {
        try { return JSON.parse(value) as T; }
        catch { return [value] as T; }
      }
      return [value] as T;
    }
    case 'date': {
      const date = new Date(value as string | number | Date);
      if (isNaN(date.getTime())) throw new Error(`Cannot cast "${value}" to date`);
      return date as T;
    }
    default: return value as T;
  }
}