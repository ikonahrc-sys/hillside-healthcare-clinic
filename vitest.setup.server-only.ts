// no-op stand-in for the "server-only" package under test - it throws by
// design when imported outside Next.js's own RSC build step, which
// includes any plain Node/Vitest run. See vitest.config.ts's alias.
export {};
