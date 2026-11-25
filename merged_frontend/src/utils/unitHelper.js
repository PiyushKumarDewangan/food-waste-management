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

/**
 * Calculates accurate approximate package weight based on real quantity and unit.
 *
 * @param {number|string} quantity - The numeric quantity (e.g. 7)
 * @param {string} unit - The unit (e.g. 'Servings', 'Kg', 'Liters', 'Boxes')
 * @returns {number} Weight in kilograms
 */
export function getPackageWeightKg(quantity, unit) {
  const qty = Number(quantity) || 1
  const u = (unit || 'servings').trim().toLowerCase()

  if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(u)) {
    return Math.max(0.5, Math.round(qty * 10) / 10)
  }
  if (['liters', 'liter', 'litres', 'litre', 'l'].includes(u)) {
    return Math.max(0.5, Math.round(qty * 1.0 * 10) / 10)
  }
  if (['boxes', 'box'].includes(u)) {
    return Math.max(1, Math.round(qty * 0.75))
  }
  if (['bags', 'bag'].includes(u)) {
    return Math.max(1, Math.round(qty * 1.5))
  }
  if (['bottles', 'bottle'].includes(u)) {
    return Math.max(0.5, Math.round(qty * 0.6 * 10) / 10)
  }
  // Default: Servings / Meals / Cooked Food (~0.35 to 0.4 kg per meal serving)
  return Math.max(1, Math.round(qty * 0.4))
}

/**
 * Checks whether an order, exchange, delivery, or request is a combined multi-item basket.
 *
 * @param {object} entity - Exchange, Delivery, or FoodRequest
 * @returns {boolean} True if multi-item basket
 */
export function isCombinedBasket(entity) {
  if (!entity) return false
  if (entity.isBasket === true) return true
  const items = entity.items || entity.donation?.items
  return Array.isArray(items) && items.length > 1
}

/**
 * Returns an array of items for an entity (exchange, request, delivery).
 *
 * @param {object} entity
 * @returns {Array} List of item objects with title, quantity, and unit
 */
export function getOrderItems(entity) {
  if (!entity) return []
  if (Array.isArray(entity.items) && entity.items.length > 0) {
    return entity.items
  }
  if (Array.isArray(entity.donation?.items) && entity.donation.items.length > 0) {
    return entity.donation.items
  }
  if (entity.donation) {
    return [
      {
        title: entity.donation.title || entity.title || 'Food Donation',
        requestedQuantity: entity.donation.quantity || entity.quantity || entity.servings || 1,
        requestedUnit: entity.donation.unit || entity.unit || 'Servings',
        category: entity.donation.category || '',
        imageUrl: entity.donation.imageUrl || '',
      },
    ]
  }
  if (entity.title) {
    return [
      {
        title: entity.title,
        requestedQuantity: entity.quantity || entity.servings || 1,
        requestedUnit: entity.unit || 'Servings',
        category: entity.category || '',
        imageUrl: entity.imageUrl || '',
      },
    ]
  }
  return []
}

/**
 * Returns total quantity across all items in an entity.
 *
 * @param {object} entity
 * @returns {number} Total units
 */
export function getTotalUnits(entity) {
  if (!entity) return 0
  const items = getOrderItems(entity)
  if (items.length > 1) {
    return items.reduce(
      (sum, it) => sum + (Number(it.requestedQuantity || it.quantity || it.servings) || 1),
      0
    )
  }
  if (items.length === 1) {
    return Number(items[0].requestedQuantity || items[0].quantity || items[0].servings) || 1
  }
  return Number(entity.quantity || entity.servings || entity.donation?.quantity) || 1
}

/**
 * Generates a clean combined food title or single food title.
 * Examples:
 * - Combined: "Combined Items"
 * - Single: "Fried Rice"
 *
 * @param {object} entity
 * @returns {string}
 */
export function getCombinedFoodTitle(entity) {
  if (!entity) return 'Food Donation'
  if (isCombinedBasket(entity)) {
    return 'Combined Items'
  }
  const items = getOrderItems(entity)
  // Single food item
  if (items.length === 1 && items[0]?.title) {
    return items[0].title
  }
  return (
    entity.donation?.title ||
    entity.title ||
    entity.donationTitle ||
    'Food Donation'
  )
}

/**
 * Generates the full heading formatted according to page style.
 * - 'volunteer': "Combined Items (5 Servings)" or "6 Servings of Fried Rice"
 * - 'with_servings_suffix': "Combined Items · 5 Servings" or "Fried Rice · 6 Servings"
 *
 * @param {object} entity
 * @param {'volunteer'|'with_servings_suffix'} style
 * @returns {string}
 */
export function getFoodHeading(entity, style = 'with_servings_suffix') {
  if (!entity) return 'Food Donation'
  const isCombined = isCombinedBasket(entity)
  const totalUnits = getTotalUnits(entity)
  const items = getOrderItems(entity)

  if (style === 'volunteer') {
    if (isCombined) {
      return `Combined Items (${totalUnits} Servings)`
    }
    const singleTitle =
      entity.donation?.title || entity.title || items[0]?.title || 'Food Donation'
    const unit = entity.donation?.unit || entity.unit || items[0]?.requestedUnit || 'Servings'
    const qty = entity.donation?.quantity || entity.quantity || items[0]?.requestedQuantity || totalUnits
    return `${formatQuantityUnit(qty, unit)} of ${singleTitle}`
  }

  // Default 'with_servings_suffix' (e.g. for Donor Exchanges and Receiver Dashboard/Pickups)
  if (isCombined) {
    return `Combined Items · ${totalUnits} Servings`
  }
  const singleTitle =
    entity.donation?.title || entity.title || entity.donationTitle || items[0]?.title || 'Food Donation'
  const unit = entity.donation?.unit || entity.unit || items[0]?.requestedUnit || 'Servings'
  const qty = entity.donation?.quantity || entity.quantity || entity.servings || items[0]?.requestedQuantity || totalUnits
  return `${singleTitle} · ${formatQuantityUnit(qty, unit)}`
}
