export const CATEGORY_FALLBACK_IMAGES = {
  'Cooked Meal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
  'Cooked Meals': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
  'Bakery': 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&auto=format&fit=crop&q=80',
  'Fresh Produce': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
  'Produce': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
  'Dairy & Eggs': 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&auto=format&fit=crop&q=80',
  'Packaged & Canned': 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
  'Packaged Goods': 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
  'Beverages': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
  'Other': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '')

export function getFoodImageUrl(imageUrl, category = 'Other') {
  if (!imageUrl) {
    return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES['Other']
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  return `${SERVER_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}

export function handleImageError(e, category = 'Other') {
  e.target.onerror = null
  e.target.src = CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES['Other']
}

export function getAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('blob:') || avatarUrl.startsWith('data:')) {
    return avatarUrl
  }
  return `${SERVER_URL}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`
}

