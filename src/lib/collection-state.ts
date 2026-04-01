/**
 * Все helper-ы ниже предполагают наличие стабильного `id`, чтобы одинаково
 * обновлять списки ингредиентов и рецептов без копипаста по компонентам.
 */
interface Identifiable {
  id: string;
}

/**
 * Подходит для create-сценария: новая запись поднимается наверх списка,
 * а возможный старый дубликат по `id` предварительно убирается.
 */
export function prependOrReplaceById<T extends Identifiable>(
  items: T[],
  nextItem: T,
): T[] {
  const itemsWithoutNext = items.filter((item) => item.id !== nextItem.id);

  return [nextItem, ...itemsWithoutNext];
}

/**
 * Используем в edit-сценарии, когда важно сохранить текущий порядок списка,
 * но заменить только одну изменившуюся запись.
 */
export function replaceById<T extends Identifiable>(
  items: T[],
  nextItem: T,
): T[] {
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

/**
 * Универсальное удаление по `id` оставляет компоненты менеджеров максимально
 * компактными и предсказуемыми.
 */
export function removeById<T extends Identifiable>(
  items: T[],
  id: string,
): T[] {
  return items.filter((item) => item.id !== id);
}
