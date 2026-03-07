// Platform resolution shim — Metro will use useGoogleAuth.web.ts or useGoogleAuth.native.ts
// This file exists only to satisfy TypeScript's module resolver.
export { useGoogleAuth } from './useGoogleAuth.web';
