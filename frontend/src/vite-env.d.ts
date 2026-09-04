/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the deployed backend (no trailing slash), e.g. https://<app>.up.railway.app. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}