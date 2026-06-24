declare module "*.json" {
  const value: any;
  export default value;
}

interface ImportMetaEnv {
  VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
