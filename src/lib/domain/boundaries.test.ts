import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { boundaryProblems, boundaryTerms } from "./boundaries";

describe("Brand Brain boundaries (DR-19)", () => {
  test("entries split into the separate terms a person means", () => {
    assert.deepEqual(boundaryTerms(["Politics, religion / crypto or NFTs", "my employer"]), ["politics", "religion", "crypto", "nfts", "my employer"]);
    assert.deepEqual(boundaryTerms(["a", "  "]), []);
  });

  test("a banned topic or avoided phrase in the text is reported", () => {
    const p = boundaryProblems("Why Crypto is the future of  game-changer advisory", { bannedTopics: ["crypto"], phrasesAvoided: ["game-changer"] });
    assert.equal(p.length, 2);
    assert.match(p[0], /banned topic.*crypto/);
    assert.match(p[1], /game-changer/);
  });

  test("whole words only, so a term inside another word is not a match", () => {
    assert.deepEqual(boundaryProblems("Cryptography for consultants", { bannedTopics: ["crypto"], phrasesAvoided: [] }), []);
    assert.deepEqual(boundaryProblems("Nothing to see", { bannedTopics: [], phrasesAvoided: [] }), []);
  });

  test("multi-word phrases match across extra spaces and line breaks", () => {
    assert.equal(boundaryProblems("Talk about my\n employer today", { bannedTopics: ["my employer"], phrasesAvoided: [] }).length, 1);
  });
});
