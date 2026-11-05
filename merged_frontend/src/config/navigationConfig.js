import {
  LayoutDashboard,
  PlusCircle,
  UtensilsCrossed,
  Inbox,
  ArrowLeftRight,
  Leaf,
  User,
  LayoutGrid,
  Search,
  FileText,
  Truck,
  TrendingUp,
} from 'lucide-react'

export const navigationConfig = [
  // Donor Menu Items
  {
    label: 'Dashboard',
    path: '/donor/dashboard',
    icon: LayoutDashboard,
    roles: ['donor'],
  },
  {
    label: 'Add Food',
    path: '/donor/add-food',
    icon: PlusCircle,
    roles: ['donor'],
  },
  {
    label: 'My Food',
    path: '/donor/my-food',
    icon: UtensilsCrossed,
    roles: ['donor'],
  },
  {
    label: 'Requests',
    path: '/donor/requests',
    icon: Inbox,
    roles: ['donor'],
    badgeKey: 'requests',
    badgeColor: 'bg-amber-500 text-white',
  },
  {
    label: 'Exchanges',
    path: '/donor/exchanges',
    icon: ArrowLeftRight,
    roles: ['donor'],
    badgeKey: 'exchanges',
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    label: 'My Impact',
    path: '/donor/impact',
    icon: Leaf,
    roles: ['donor'],
  },
  {
    label: 'Profile',
    path: '/donor/profile',
    icon: User,
    roles: ['donor'],
  },

  // Receiver Menu Items (Matching Screenshots)
  {
    label: 'Dashboard',
    path: '/receiver/dashboard',
    icon: LayoutGrid,
    roles: ['receiver'],
  },
  {
    label: 'Browse Food',
    path: '/receiver/browse',
    icon: Search,
    roles: ['receiver'],
  },
  {
    label: 'My Requests',
    path: '/receiver/requests',
    icon: FileText,
    roles: ['receiver'],
    badgeKey: 'requests',
    badgeColor: 'bg-[#F59E0B] text-white',
  },
  {
    label: 'Active Pickups',
    path: '/receiver/pickups',
    icon: Truck,
    roles: ['receiver'],
    badgeKey: 'pickups',
    badgeColor: 'bg-[#2E7D32] text-white',
  },
  {
    label: 'History & Impact',
    path: '/receiver/history',
    icon: TrendingUp,
    roles: ['receiver'],
  },
  {
    label: 'My Profile',
    path: '/receiver/profile',
    icon: User,
    roles: ['receiver'],
  },

  // Volunteer Menu Items (Matching PDF Design Pages 1-8)
  {
    label: 'Dashboard',
    path: '/volunteer/dashboard',
    icon: LayoutDashboard,
    roles: ['volunteer'],
  },
  {
    label: 'My Deliveries',
    path: '/volunteer/deliveries',
    icon: Truck,
    roles: ['volunteer'],
    badgeKey: 'deliveries',
    badgeColor: 'bg-[#2E7D32] text-white',
  },
  {
    label: 'Delivery History',
    path: '/volunteer/history',
    icon: FileText,
    roles: ['volunteer'],
  },
  {
    label: 'My Impact',
    path: '/volunteer/impact',
    icon: TrendingUp,
    roles: ['volunteer'],
  },
  {
    label: 'Profile & Vehicle',
    path: '/volunteer/profile',
    icon: User,
    roles: ['volunteer'],
  },
]

export default navigationConfig
