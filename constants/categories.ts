// constants/categories.ts
//
// Lista cerrada de categorías. La BBDD guarda el `id` (minúsculas, sin acentos);
// la UI muestra el `label`. Si en el futuro queremos renombrar una categoría,
// se cambia el label aquí sin tocar datos.

export type CategoryId = 'historia' | 'arte' | 'gastronomia' | 'cultura';

export interface Category {
  id: CategoryId;
  label: string;
}

export const CATEGORIES: readonly Category[] = [
  { id: 'historia',    label: 'Historia' },
  { id: 'arte',        label: 'Arte' },
  { id: 'gastronomia', label: 'Gastronomía' },
  { id: 'cultura',     label: 'Cultura' },
] as const;

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id);

export function getCategoryLabel(id: CategoryId | string | null | undefined): string {
  if (!id) return '';
  return CATEGORIES.find((c) => c.id === id)?.label ?? '';
}

export function isValidCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && CATEGORY_IDS.includes(value as CategoryId);
}
