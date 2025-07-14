/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_MAPBOX_API_KEY: string
  readonly VITE_USE_REAL_AERIAL_DATA: string
  readonly VITE_AERIAL_PROVIDER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}