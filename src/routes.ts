import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('u/:handle', 'routes/profile.tsx'),
  route('u/:handle/:room', 'routes/room-profile.tsx'),
  route('u/:handle/:room/room', 'routes/experience.tsx'),
  route('login', 'routes/login.tsx'),
  route('auth/confirm', 'routes/auth.confirm.tsx'),
  route('terms', 'routes/terms.tsx'),
  route('privacy', 'routes/privacy.tsx'),
  route('content-policy', 'routes/content-policy.tsx'),
  route('settings', 'routes/settings.tsx'),
  route('admin', 'routes/admin.tsx'),
] satisfies RouteConfig;
