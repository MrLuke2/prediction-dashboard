/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAPER_TRADING: string;
  readonly VITE_WS_URL: string;
  // Add other env variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
