import { Unit, type Unit as UnitValue } from '@/generated/prisma/enums';

export const UNIT_LABELS: Record<UnitValue, string> = {
  [Unit.GRAM]: 'г',
  [Unit.KILOGRAM]: 'кг',
  [Unit.LITER]: 'л',
  [Unit.MILLILITER]: 'мл',
  [Unit.PIECE]: 'шт',
};

export function getUnitLabel(unit: UnitValue): string {
  return UNIT_LABELS[unit];
}
