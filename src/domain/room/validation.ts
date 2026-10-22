import type { RoomDocument } from '@/domain/room/document';
import type { RoomIssue } from '@/domain/room/issues';
import {
  estimateRoomBudget,
  validateRoomBudget,
  type AssetBudgetStats,
} from '@/domain/room/budgets';
import { parseRoomDocument } from '@/domain/room/schema';
import {
  validateRoomRules,
  type RoomRulesContext,
} from '@/domain/room/rules';

export interface RoomValidationOptions extends RoomRulesContext {
  assets?: Readonly<Record<string, AssetBudgetStats>>;
}

export interface RoomValidationResult {
  document: RoomDocument;
  issues: RoomIssue[];
}

/**
 * Punto de entrada para validar una habitación antes de guardar o publicar.
 * Lanza si la estructura es inválida; devuelve reglas y presupuestos como issues.
 */
export function validateRoomDocument(
  input: unknown,
  options: RoomValidationOptions = {},
): RoomValidationResult {
  const document = parseRoomDocument(input);
  const issues: RoomIssue[] = [
    ...validateRoomRules(document, options),
    ...validateRoomBudget(estimateRoomBudget(document, options.assets)),
  ];

  return { document, issues };
}
