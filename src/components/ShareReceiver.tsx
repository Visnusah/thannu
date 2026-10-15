// TypeScript's resolver does not apply Metro's platform-specific extension
// rules. The native implementation is selected by Metro on iOS/Android, while
// this web-safe fallback keeps the shared import type-checkable.
export { ShareReceiver } from './ShareReceiver.web'
