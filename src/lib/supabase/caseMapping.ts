// Shallow snake_case <-> camelCase conversion for Postgres rows. Only
// top-level keys are touched — jsonb column *values* (provenance, metadata,
// relations, blocks, ...) are stored and returned as-is, camelCase intact.

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

export function rowToCamel<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value
  }
  return result as T
}

export function rowsToCamel<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => rowToCamel<T>(row))
}

export function toSnakeRow(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[camelToSnake(key)] = value
  }
  return result
}
