import { localProvider } from '../../adapters/local/LocalDataAdapter';

export function exportDatabaseV2(): string {
  return localProvider.exportData();
}

export function importDatabaseV2(jsonString: string): boolean {
  try {
    // Ideally we would run this through a Zod schema for the entire DB structure
    // But since it's just a mock/local provider for now, we just pass it to the provider.
    localProvider.importData(jsonString);
    return true;
  } catch (error) {
    console.error("Failed to import V2 database:", error);
    return false;
  }
}
