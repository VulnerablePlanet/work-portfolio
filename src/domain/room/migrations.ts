import type { RoomDocument } from '@/domain/room/document';
import { parseRoomDocument } from '@/domain/room/schema';

export const CURRENT_SCHEMA_VERSION = 1;

type Migration = (document: unknown) => unknown;

/**
 * Cadena de migraciones. La clave es la versión de origen; la función devuelve
 * un documento con la versión siguiente. Vacía en v1.
 */
const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export class UnsupportedSchemaVersionError extends Error {
  constructor(readonly version: unknown) {
    super(
      `Versión de documento no soportada: ${String(version)}. La versión actual es ${CURRENT_SCHEMA_VERSION}.`,
    );
    this.name = 'UnsupportedSchemaVersionError';
  }
}

function readVersion(input: unknown): number {
  if (typeof input !== 'object' || input === null) {
    throw new UnsupportedSchemaVersionError(input);
  }

  const version = (input as { schemaVersion?: unknown }).schemaVersion;

  if (
    typeof version !== 'number' ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    throw new UnsupportedSchemaVersionError(version);
  }

  return version;
}

/**
 * Migra un documento desde su versión hasta la actual y lo valida.
 * Un documento con versión mayor se rechaza: nunca se sobrescribe.
 */
export function migrateRoomDocument(input: unknown): RoomDocument {
  let version = readVersion(input);

  if (version > CURRENT_SCHEMA_VERSION) {
    throw new UnsupportedSchemaVersionError(version);
  }

  let document = input;

  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];

    if (!migrate) {
      throw new UnsupportedSchemaVersionError(version);
    }

    document = migrate(document);
    version += 1;
  }

  return parseRoomDocument(document);
}
