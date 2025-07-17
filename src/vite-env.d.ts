/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GOOGLE_MAPS_API_KEY: string
  readonly MAPBOX_API_KEY: string
  readonly USE_REAL_AERIAL_DATA: string
  readonly AERIAL_PROVIDER: string
  readonly SUPABASE_URL: string
  readonly SUPABASE_ANON_KEY: string
  readonly API_BASE_URL: string
  readonly API_URL: string
  readonly VERCEL_ENV: string
  readonly NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}