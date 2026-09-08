/**
 * QA shim for `next/navigation`.
 *
 * `redirect()` and `notFound()` signal by throwing, and `guarded()` lets those
 * throws through untouched. The harness catches them and reads them as what
 * they are: a refusal. The digests match Next's own so `isNextControlFlow`
 * recognises them.
 */
export function redirect(url, type = "replace") {
  const error = new Error(`NEXT_REDIRECT ${url}`);
  error.digest = `NEXT_REDIRECT;${type};${url};307;`;
  throw error;
}
export function permanentRedirect(url) {
  const error = new Error(`NEXT_REDIRECT ${url}`);
  error.digest = `NEXT_REDIRECT;replace;${url};308;`;
  throw error;
}
export function notFound() {
  const error = new Error("NEXT_NOT_FOUND");
  error.digest = "NEXT_NOT_FOUND";
  throw error;
}
function noHooks() {
  throw new Error("Client-side navigation hooks are not available in the QA harness.");
}
export const usePathname = noHooks;
export const useRouter = noHooks;
export const useSearchParams = noHooks;
