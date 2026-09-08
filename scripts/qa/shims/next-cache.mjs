/** QA shim for `next/cache`: nothing to revalidate outside a server. */
export function revalidatePath() {}
export function revalidateTag() {}
export function unstable_noStore() {}
export function unstable_cache(fn) {
  return fn;
}
