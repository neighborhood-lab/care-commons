/// <reference types="vite/client" />

// This interface extends ImportMeta to correctly type the 'env' object.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // Add other VITE_* environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}