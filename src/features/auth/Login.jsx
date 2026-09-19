import * as Sentry from "@sentry/react";
import Login, { LoginFallback } from './LoginView';

const WrappedLogin = Sentry.withErrorBoundary(Login, {
  fallback: LoginFallback,
  showDialog: true,
});

export default WrappedLogin;
