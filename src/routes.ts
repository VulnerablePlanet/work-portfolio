import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('u/:handle', 'routes/profile.tsx'),
  route('u/:handle/:room', 'routes/room-profile.tsx'),
  route('u/:handle/:room/room', 'routes/experience.tsx'),
  route('login', 'routes/login.tsx'),
  route('auth/confirm', 'routes/auth.confirm.tsx'),
] satisfies RouteConfig;
