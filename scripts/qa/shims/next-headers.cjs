function jar() { globalThis.__qa ??= { cookies: new Map(), headers: new Map() }; return globalThis.__qa; }
async function cookies() {
  const q = jar();
  return {
    get(name) { const v = q.cookies.get(name); return v === undefined ? undefined : { name, value: v }; },
    getAll() { return [...q.cookies.entries()].map(([name, value]) => ({ name, value })); },
    has(name) { return q.cookies.has(name); },
    set(name, value) { if (typeof name === "object" && name) q.cookies.set(name.name, name.value); else q.cookies.set(name, value); },
    delete(name) { q.cookies.delete(name); },
  };
}
async function headers() {
  const q = jar(); const h = new Headers(); h.set("user-agent", "ThreadlineQA/1.0");
  for (const [k, v] of q.headers) h.set(k, v); return h;
}
module.exports = { cookies, headers };
