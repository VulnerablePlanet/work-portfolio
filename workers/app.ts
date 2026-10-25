import { createRequestHandler, type ServerBuild } from 'react-router';

interface R2ObjectLike {
  text(): Promise<string>;
}

interface R2BucketLike {
  get(key: string): Promise<R2ObjectLike | null>;
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
}

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ROOM_SNAPSHOTS?: R2BucketLike;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build') as Promise<ServerBuild>,
  import.meta.env.MODE,
);

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
};
