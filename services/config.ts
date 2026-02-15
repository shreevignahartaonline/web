// Centralized API configuration
// Change the URL in .env.local (for local dev) or set NEXT_PUBLIC_API_URL in your deployment environment.
// This file is the single source of truth — no other service file should hardcode the URL.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-app-v43g.onrender.com'

// Root URL (e.g., http://localhost:5000)
// Used by: upload, item, party services that have /api in their endpoint paths
export const API_BASE_URL = BASE_URL

// API URL with /api prefix (e.g., http://localhost:5000/api)
// Used by: sale, purchase, payment services
export const API_URL = `${BASE_URL}/api`
