import assert from "assert";
import { AnswerDifficulty, Flashcard, BucketMap } from "../src/flashcards";
import {
  toBucketSets,
  getBucketRange,
  practice,
  update,
  getHint,
  computeProgress,
} from "../src/algorithm";

/**
 * Helper to create a Flashcard instance.
 */
function createFlashcard(front: string, back: string): Flashcard {
  // The Flashcard constructor takes (front, back, hint, tags)
  return new Flashcard(front, back, `Hint: ${front}`, [front]);
}

/*
 * Testing strategy for toBucketSets():
 * - Test with a BucketMap having non-consecutive bucket numbers.
 * - Ensure that the resulting array has a length equal to the highest bucket index + 1.
 * - Verify that empty buckets become empty sets.
 */
describe("toBucketSets()", () => {
  it("should convert a BucketMap to an array-of-sets with correct indices", () => {
    const bucketMap: BucketMap = new Map();
    const cardA = createFlashcard("A", "Answer A");
    const cardB = createFlashcard("B", "Answer B");
    
    // Populate bucket 0 and bucket 2 only.
    bucketMap.set(0, new Set([cardA]));
    bucketMap.set(2, new Set([cardB]));

    const bucketArray = toBucketSets(bucketMap);
    // Expect an array length of 3 (indices 0, 1, 2)
    assert.strictEqual(bucketArray.length, 3);
    // Use non-null assertions because we know these indices exist.
    assert.ok(bucketArray[0]!.has(cardA), "Bucket 0 should contain cardA");
    assert.strictEqual(bucketArray[1]!.size, 0, "Bucket 1 should be empty");
    assert.ok(bucketArray[2]!.has(cardB), "Bucket 2 should contain cardB");
  });
});

/*
 * Testing strategy for getBucketRange():
 * - When all buckets are empty, the function should return undefined.
 * - When some buckets contain cards, return the smallest and largest indices with cards.
 */
describe("getBucketRange()", () => {
  it("should return undefined when all buckets are empty", () => {
    const buckets = [new Set<Flashcard>(), new Set<Flashcard>(), new Set<Flashcard>()];
    const range = getBucketRange(buckets);
    assert.strictEqual(range, undefined);
  });

  it("should return the correct range when buckets have flashcards", () => {
    // Create an array with 5 elements.
    const buckets: Array<Set<Flashcard>> = [
      new Set<Flashcard>(), // index 0: empty
      new Set<Flashcard>(), // index 1: empty
      new Set<Flashcard>(), // index 2: will add a card
      new Set<Flashcard>(), // index 3: empty
      new Set<Flashcard>(), // index 4: will add a card
    ];
    const card = createFlashcard("Test", "Answer");
    buckets[2]!.add(card);
    buckets[4]!.add(card);
    const range = getBucketRange(buckets);
    assert.deepStrictEqual(range, { minBucket: 2, maxBucket: 4 });
  });
});

/*
 * Testing strategy for practice():
 * - Assume scheduling: bucket 0 is due every day, and for bucket i (i>=1),
 *   a card is due if day % (2 ** i) === 0.
 * - Verify on different days that only the due cards are selected.
 */
describe("practice()", () => {
  it("should select all cards on day 0", () => {
    // Create three buckets, each with one card.
    const buckets: Array<Set<Flashcard>> = [
      new Set<Flashcard>(),
      new Set<Flashcard>(),
      new Set<Flashcard>(),
    ];
    const card0 = createFlashcard("Card0", "Answer0");
    const card1 = createFlashcard("Card1", "Answer1");
    const card2 = createFlashcard("Card2", "Answer2");
    buckets[0]!.add(card0);
    buckets[1]!.add(card1);
    buckets[2]!.add(card2);

    const selectedDay0 = practice(buckets, 0);
    // On day 0, all cards should be due.
    assert.ok(selectedDay0.has(card0));
    assert.ok(selectedDay0.has(card1));
    assert.ok(selectedDay0.has(card2));
  });

  it("should select cards according to their scheduling rules", () => {
    // Create three buckets.
    const buckets: Array<Set<Flashcard>> = [
      new Set<Flashcard>(), // bucket 0
      new Set<Flashcard>(), // bucket 1 (due on days divisible by 2)
      new Set<Flashcard>(), // bucket 2 (due on days divisible by 4)
    ];
    const card0 = createFlashcard("Card0", "Answer0");
    const card1 = createFlashcard("Card1", "Answer1");
    const card2 = createFlashcard("Card2", "Answer2");
    buckets[0]!.add(card0);
    buckets[1]!.add(card1);
    buckets[2]!.add(card2);

    // On day 3: bucket 0 is due; bucket 1 (3 % 2 !== 0) and bucket 2 (3 % 4 !== 0) are not.
    const selectedDay3 = practice(buckets, 3);
    assert.ok(selectedDay3.has(card0));
    assert.ok(!selectedDay3.has(card1));
    assert.ok(!selectedDay3.has(card2));

    // On day 4: bucket 0, bucket 1 (4 % 2 === 0), and bucket 2 (4 % 4 === 0) are due.
    const selectedDay4 = practice(buckets, 4);
    assert.ok(selectedDay4.has(card0));
    assert.ok(selectedDay4.has(card1));
    assert.ok(selectedDay4.has(card2));
  });
});

/*
 * Testing strategy for update():
 * - Given a card in a bucket, verify that:
 *   - An Easy answer moves it to the next higher bucket.
 *   - A Hard answer leaves it in the same bucket.
 *   - A Wrong answer moves it to bucket 0.
 */
describe("update()", () => {
  it("should update the bucket of a card based on answer difficulty", () => {
    // Start with a card in bucket 2.
    const bucketMap: BucketMap = new Map();
    const card = createFlashcard("UpdateCard", "UpdateAnswer");
    bucketMap.set(2, new Set([card]));

    // Easy answer: move card to bucket 3.
    let updatedMap = update(bucketMap, card, AnswerDifficulty.Easy);
    assert.ok(!updatedMap.get(2)?.has(card), "Card should no longer be in bucket 2");
    assert.ok(updatedMap.get(3)?.has(card), "Card should be moved to bucket 3");

    // Hard answer: card remains in the same bucket.
    bucketMap.set(2, new Set([card])); // reset to bucket 2
    updatedMap = update(bucketMap, card, AnswerDifficulty.Hard);
    assert.ok(updatedMap.get(2)?.has(card), "Card should remain in bucket 2 for Hard answer");

    // Wrong answer: move card to bucket 0.
    bucketMap.set(2, new Set([card])); // reset to bucket 2
    updatedMap = update(bucketMap, card, AnswerDifficulty.Wrong);
    assert.ok(!updatedMap.get(2)?.has(card), "Card should be removed from bucket 2");
    assert.ok(updatedMap.get(0)?.has(card), "Card should be moved to bucket 0 for Wrong answer");
  });
});

/*
 * Testing strategy for getHint():
 * - Verify that the returned hint is a non-empty string.
 * - (Assuming getHint returns the card's stored hint.)
 */
describe("getHint()", () => {
  it("should return a non-empty hint string", () => {
    const card = createFlashcard("Front", "Back");
    const hint = getHint(card);
    assert.strictEqual(typeof hint, "string");
    assert.ok(hint.length > 0, "Hint should be a non-empty string");
  });
});

/*
 * Testing strategy for computeProgress():
 * - Assume computeProgress returns an object with at least:
 *   - totalCards: total unique flashcards.
 *   - learnedCards: cards not in bucket 0.
 *   - bucketDistribution: an array with the count of cards in each bucket.
 * - Create simulated bucket data and a sample history, then verify the values.
 */
describe("computeProgress()", () => {
  it("should compute progress statistics correctly", () => {
    // Construct buckets: bucket 0 has 1 card, bucket 2 has 1 card.
    const buckets: Array<Set<Flashcard>> = [
      new Set<Flashcard>(),
      new Set<Flashcard>(),
      new Set<Flashcard>(),
    ];
    const card1 = createFlashcard("Card1", "Answer1");
    const card2 = createFlashcard("Card2", "Answer2");
    buckets[0]!.add(card1);
    buckets[2]!.add(card2);

    // Simulated history of practice.
    const history = [
      { card: card1, difficulty: AnswerDifficulty.Easy },
      { card: card2, difficulty: AnswerDifficulty.Wrong },
    ];

    const progress = computeProgress(buckets, history);
    // For our assumed specification:
    // - totalCards should equal 2.
    // - learnedCards: cards not in bucket 0 are considered learned (so card2 only).
    // - bucketDistribution should be [1, 0, 1].
    assert.strictEqual(progress.totalCards, 2, "Total cards should be 2");
    assert.strictEqual(progress.learnedCards, 1, "Learned cards should be 1");
    assert.deepStrictEqual(
      progress.bucketDistribution,
      [1, 0, 1],
      "Bucket distribution should be [1, 0, 1]"
    );
  });
});
