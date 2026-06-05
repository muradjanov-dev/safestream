// Ambient declarations so TypeScript recognises process.env before @types/node
// is installed. Next.js statically replaces NEXT_PUBLIC_* at build time.
declare const process: {
  env: {
    readonly NEXT_PUBLIC_API_URL?: string;
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly [key: string]: string | undefined;
  };
};
