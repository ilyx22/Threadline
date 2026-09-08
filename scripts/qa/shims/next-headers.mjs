/**
 * QA shim for `next/headers`.
 *
 * Server actions read the session from the request cookie jar. Outside a
 * request there is no jar, so the harness supplies one: `globalThis.__qa`
 * holds the cookies the "current request" carries. `actAs()` in context.ts
 * mints a real database session and drops its token here, which means every
 * guard downstream runs its genuine code path against a genuine session row.
 */
function jar() {
  globalThis.__qa ??= { cookies: new Map(), headers: new Map() };
  return globalThis.__qa;
}

export async function cookies() {
  const q = jar();
  return {
    get(name) {
      const value = q.cookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
    getAll() {
      return [...q.cookies.entries()].map(([name, value]) => ({ name, value }));
    },
    has(name) {
      return q.cookies.has(name);
    },
    set(name, value) {
      if (typeof name === "object" && name !== null) {
        q.cookies.set(name.name, name.value);
      } else {
        q.cookies.set(name, value);
      }
    },
    delete(name) {
      q.cookies.delete(name);
    },
  };
}

export async function headers() {
  const q = jar();
  const h = new Headers();
  h.set("user-agent", "ThreadlineQA/1.0");
  for (const [k, v] of q.headers) h.set(k, v);
  return h;
}
