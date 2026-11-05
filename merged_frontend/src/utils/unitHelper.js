/**
 * Food quantity unit definitions and formatting helpers.
 * Supported units: Servings, Kg, Liters, Items, Boxes, Bags, Bottles.
 */

export const FOOD_UNITS = [
  'Servings',
  'Kg',
  'Liters',
  'Items',
  'Boxes',
  'Bags',
  'Bottles',
]

/**
 * Normalizes and capitalizes food units. Handles legacy units like 'loaves' gracefully.
 *
 * @param {string} unit - Raw unit string from database or user input
 * @returns {string} Standard formatted unit
 */
export function formatUnit(unit) {
  if (!unit || typeof unit !== 'string') return 'Servings'
  const trimmed = unit.trim().toLowerCase()

  switch (trimmed) {
    case 'servings':
    case 'serving':
      return 'Servings'
    case 'kg':
    case 'kgs':
    case 'kilogram':
    case 'kilograms':
      return 'Kg'
    case 'liters':
    case 'liter':
    case 'litres':
    case 'litre':
    case 'l':
      return 'Liters'
    case 'items':
    case 'item':
      return 'Items'
    case 'boxes':
    case 'box':
      return 'Boxes'
    case 'bags':
    case 'bag':
      return 'Bags'
    case 'bottles':
    case 'bottle':
      return 'Bottles'
    case 'loaves':
    case 'loaf':
      // Graceful fallback for legacy records
      return 'Loaves'
    default:
      // Capitalize first letter of any other string
      return unit.charAt(0).toUpperCase() + unit.slice(1)
  }
}

/**
 * Formats quantity and unit together, preventing duplicate labels.
 * Example: (10, 'servings') => '10 Servings'
 *          (5, 'kg') => '5 Kg'
 *          (20, 'boxes') => '20 Boxes'
 *
 * @param {number|string} quantity
 * @param {string} unit
 * @returns {string} Formatted quantity and unit
 */
export function formatQuantityUnit(quantity, unit) {
  const qty = Number(quantity) || 0
  const formattedUnit = formatUnit(unit)
  return `${qty} ${formattedUnit}`
}
