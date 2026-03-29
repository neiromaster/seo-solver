import { describe, expect, test } from 'bun:test';
import { flatten } from './flatten';

describe('flatten', () => {
  test('returns empty object for empty input', () => {
    // Arrange
    const obj = {};

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({});
  });

  test('keeps flat string values as-is', () => {
    // Arrange
    const obj = { name: 'Alice', type: 'Person' };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({ name: 'Alice', type: 'Person' });
  });

  test('converts number value to string', () => {
    // Arrange
    const obj = { count: 42 };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({ count: '42' });
  });

  test('converts boolean value to string', () => {
    // Arrange
    const obj = { active: true, archived: false };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({ active: 'true', archived: 'false' });
  });

  test('converts null value to literal string "null"', () => {
    // Arrange
    const obj = { value: null };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({ value: 'null' });
  });

  test('converts undefined value to empty string', () => {
    // Arrange
    const obj = { value: undefined };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({ value: '' });
  });

  test('serialises array value to JSON string', () => {
    // Arrange
    const obj = { tags: ['a', 'b', 'c'] };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({ tags: '["a","b","c"]' });
  });

  test('flattens one level of nesting with dot-separated key', () => {
    // Arrange
    const obj = { address: { city: 'Berlin' } };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({ 'address.city': 'Berlin' });
  });

  test('flattens deeply nested object', () => {
    // Arrange
    const obj = { a: { b: { c: 'deep' } } };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({ 'a.b.c': 'deep' });
  });

  test('flattens mixed flat and nested keys', () => {
    // Arrange
    const obj = { name: 'Alice', address: { city: 'Berlin', zip: '10115' } };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({
      name: 'Alice',
      'address.city': 'Berlin',
      'address.zip': '10115',
    });
  });

  test('treats array at nested path as leaf (JSON stringified)', () => {
    // Arrange
    const obj = { meta: { keywords: ['seo', 'test'] } };

    // Act
    const result = flatten(obj);

    // Assert
    expect(result).toEqual({ 'meta.keywords': '["seo","test"]' });
  });

  test('prepends prefix to all keys when provided', () => {
    // Arrange
    const obj = { type: 'Person' };

    // Act
    const result = flatten(obj, 'schema');

    // Assert
    expect(result).toEqual({ 'schema.type': 'Person' });
  });

  test('prepends prefix recursively through nested objects', () => {
    // Arrange
    const obj = { address: { city: 'Paris' } };

    // Act
    const result = flatten(obj, 'root');

    // Assert
    expect(result).toEqual({ 'root.address.city': 'Paris' });
  });
});
