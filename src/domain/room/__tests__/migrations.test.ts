import { describe, expect, it } from 'vitest';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import {
  UnsupportedSchemaVersionError,
  migrateRoomDocument,
} from '@/domain/room/migrations';

describe('migraciones del documento', () => {
  it('acepta y valida la versión actual', () => {
    const document = migrateRoomDocument(WORKSPACE_SEED_V1);

    expect(document.schemaVersion).toBe(1);
    expect(document.nodes).toHaveLength(4);
  });

  it('rechaza una versión futura sin sobrescribirla', () => {
    expect(() =>
      migrateRoomDocument({ ...WORKSPACE_SEED_V1, schemaVersion: 2 }),
    ).toThrow(UnsupportedSchemaVersionError);
  });

  it('rechaza entradas que no son documentos', () => {
    expect(() => migrateRoomDocument(null)).toThrow(
      UnsupportedSchemaVersionError,
    );
    expect(() => migrateRoomDocument('texto')).toThrow(
      UnsupportedSchemaVersionError,
    );
    expect(() => migrateRoomDocument({ schemaVersion: 0 })).toThrow(
      UnsupportedSchemaVersionError,
    );
  });
});
