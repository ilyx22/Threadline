function redirect(url, type = "replace") { const e = new Error(`NEXT_REDIRECT ${url}`); e.digest = `NEXT_REDIRECT;${type};${url};307;`; throw e; }
function permanentRedirect(url) { const e = new Error(`NEXT_REDIRECT ${url}`); e.digest = `NEXT_REDIRECT;replace;${url};308;`; throw e; }
function notFound() { const e = new Error("NEXT_NOT_FOUND"); e.digest = "NEXT_NOT_FOUND"; throw e; }
function noHooks() { throw new Error("Client hooks unavailable in QA harness"); }
module.exports = { redirect, permanentRedirect, notFound, usePathname: noHooks, useRouter: noHooks, useSearchParams: noHooks };
