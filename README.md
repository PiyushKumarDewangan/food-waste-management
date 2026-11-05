# FoodShare - Receiver / NGO Dashboard Module

## 1. Overview
The **Receiver / NGO Dashboard** module provides non-profit shelters and community organizations with an intuitive, pixel-accurate interface to browse surplus food donations, submit and track requests, monitor active volunteer deliveries and direct self-pickups, review historical impact, and manage organization capacity and dietary preferences.

---

## 2. Environment Variables

### Backend (`food-share-backend/.env`)
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=dev_access_secret_change_me_1234567890
JWT_REFRESH_SECRET=dev_refresh_secret_change_me_0987654321
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
REFRESH_COOKIE_NAME=fb_refresh_token
```

### Frontend (`merged_frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 3. Running Migration & Seed

The seed script initializes the demo receiver account (Maria Chen / Hope Harbor Shelter), sample listings with live countdown timers, pending & approved requests, active courier and self-pickup orders (with 4-digit handover code `#4821`), and historical completed collections.

```bash
cd food-share-backend
npm run seed:receiver
```

---

## 4. Demo Login Credentials

| Role | Email | Password | Organization / Notes |
| :--- | :--- | :--- | :--- |
| **Receiver (NGO)** | `contact@hopeharbor.org` | `HopeHarbor123!` | Hope Harbor Shelter (Initials: MC) |
| **Donor** | `piyushdewangan461@gmail.com` | *(existing)* | Piyush Kumar Dewangan |
| **Admin** | `admin@foodshare.com` | *(existing)* | FoodShare Admin |

Upon logging in with the receiver credentials, the application automatically redirects to `/receiver/dashboard`.

---

## 5. Receiver Routes & Navigation

| Route | Page | Key Features |
| :--- | :--- | :--- |
| `/receiver/dashboard` | **Dashboard** | 4 impact stat cards, Active Delivery tracking stepper with courier David K., Quick Actions, Expiring Soon cards with live countdown. |
| `/receiver/browse` | **Browse Food** | Debounced live search, distance filter (5/10/25/50 mi), category chips, dietary filters, 3-column card grid, broken image fallback, Request Food modal. |
| `/receiver/requests` | **My Requests** | Tabs with live counts (All, Pending, Approved, Declined), request cards, Cancel Request confirmation, View in Pickups link. |
| `/receiver/pickups` | **Active Pickups** | Volunteer Courier card (David K., call button, 5-step stepper), Self-Pickup card (dashed handover code `#4821`), Mark as Received, Rating & Feedback modal, Report Issue modal. |
| `/receiver/history` | **History & Impact** | 4 impact cards, Category Breakdown progress bars, Collection History table with live search, printable/PDF tax receipt generation. |
| `/receiver/profile` | **Profile & Needs** | Verified 501(c)(3) badge banner, 2-column org form, Capacity & Dietary tab, and Notifications tab with 6 switch toggles. |

---

## 6. How to Run the Application

### Start Backend
```bash
cd food-share-backend
npm run dev
# Server runs on http://localhost:5000
```

### Start Frontend
```bash
cd merged_frontend
npm run dev
# Frontend runs on http://localhost:5173
```
