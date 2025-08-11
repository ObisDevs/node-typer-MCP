import { describe, it, expect } from 'vitest';
import { inferType, cast } from '../src/utils/index';

describe('Utils functionality', () => {
  it('should infer basic types', () => {
    expect(inferType('test')).toBe('string');
    expect(inferType(123)).toBe('number');
    expect(inferType(true)).toBe('boolean');
    expect(inferType(null)).toBe('null');
    expect(inferType([])).toBe('array');
  });

  it('should infer smart string types', () => {
    expect(inferType('123')).toBe('number');
    expect(inferType('true')).toBe('boolean');
    expect(inferType('2023-01-01')).toBe('date');
  });

  it('should cast values correctly', () => {
    expect(cast('123', 'number')).toBe(123);
    expect(cast('true', 'boolean')).toBe(true);
    expect(cast(123, 'string')).toBe('123');
  });

  it('should throw on invalid casts', () => {
    expect(() => cast('abc', 'number')).toThrow();
    expect(() => cast('invalid', 'date')).toThrow();
  });
});