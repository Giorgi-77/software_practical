/**
 * Problem Set 1: Flashcards - Algorithm Functions
 *
 * This file contains the implementations for the flashcard algorithm functions
 * as described in the problem set handout.
 *
 * Please DO NOT modify the signatures of the exported functions in this file,
 * or you risk failing the autograder.
 */

import { Flashcard, AnswerDifficulty, BucketMap } from "./flashcards";

/**
 * Converts a Map representation of learning buckets into an Array-of-Set representation.
 *
 * @param buckets Map where keys are bucket numbers and values are sets of Flashcards.
 * @returns Array of Sets, where element at index i is the set of flashcards in bucket i.
 *          Buckets with no cards will have empty sets in the array.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function toBucketSets(buckets: BucketMap): Array<Set<Flashcard>> {
  // Determine the maximum bucket index present
  let maxBucket = 0;
  for (let key of buckets.keys()) {
    if (key > maxBucket) {
      maxBucket = key;
    }
  }
  const result: Array<Set<Flashcard>> = [];
  for (let i = 0; i <= maxBucket; i++) {
    // Use the existing set if available, or an empty set otherwise
    result[i] = buckets.get(i) || new Set<Flashcard>();
  }
  return result;
}

/**
 * Finds the range of buckets that contain flashcards, as a rough measure of progress.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @returns object with minBucket and maxBucket properties representing the range,
 *          or undefined if no buckets contain cards.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function getBucketRange(
  buckets: Array<Set<Flashcard>>
): { minBucket: number; maxBucket: number } | undefined {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i]!.size > 0) {
      if (i < min) min = i;
      if (i > max) max = i;
    }
  }
  if (min === Infinity) return undefined;
  return { minBucket: min, maxBucket: max };
}

/**
 * Selects cards to practice on a particular day.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @param day current day number (starting from 0).
 * @returns a Set of Flashcards that should be practiced on day `day`,
 *          according to the Modified-Leitner algorithm.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function practice(
  buckets: Array<Set<Flashcard>>,
  day: number
): Set<Flashcard> {
  const result = new Set<Flashcard>();
  for (let i = 0; i < buckets.length; i++) {
    // Bucket 0: always practiced
    if (i === 0) {
      for (let card of buckets[i]!) {
        result.add(card);
      }
    } else {
      // For bucket i (i>=1), practice if day % (2**i) === 0
      if (day % (2 ** i) === 0) {
        for (let card of buckets[i]!) {
          result.add(card);
        }
      }
    }
  }
  return result;
}

/**
 * Updates a card's bucket number after a practice trial.
 *
 * @param buckets Map representation of learning buckets.
 * @param card flashcard that was practiced.
 * @param difficulty how well the user did on the card in this practice trial.
 * @returns updated Map of learning buckets.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function update(
  buckets: BucketMap,
  card: Flashcard,
  difficulty: AnswerDifficulty
): BucketMap {
  // Find the current bucket that contains the card
  let currentBucket: number | undefined = undefined;
  for (let [bucket, set] of buckets.entries()) {
    if (set.has(card)) {
      currentBucket = bucket;
      break;
    }
  }
  if (currentBucket === undefined) {
    // If card not found, assume it's in bucket 0.
    currentBucket = 0;
  }

  // Create a new copy of the bucket map to update
  const newBuckets = new Map<number, Set<Flashcard>>(buckets);
  // Remove the card from its current bucket
  newBuckets.get(currentBucket)?.delete(card);

  // Decide new bucket based on answer difficulty
  let newBucket: number;
  if (difficulty === AnswerDifficulty.Easy) {
    newBucket = currentBucket + 1;
  } else if (difficulty === AnswerDifficulty.Hard) {
    newBucket = currentBucket;
  } else {
    // For Wrong, reset to bucket 0
    newBucket = 0;
  }

  // Add the card to the new bucket; create the bucket if it doesn't exist.
  let bucketSet = newBuckets.get(newBucket);
  if (!bucketSet) {
    bucketSet = new Set<Flashcard>();
    newBuckets.set(newBucket, bucketSet);
  }
  bucketSet.add(card);
  return newBuckets;
}

/**
 * Generates a hint for a flashcard.
 *
 * @param card flashcard to hint
 * @returns a hint for the front of the flashcard.
 * @spec.requires card is a valid Flashcard.
 */
export function getHint(card: Flashcard): string {
  // Simply return the card's hint property.
  return card.hint;
}

/**
 * Computes statistics about the user's learning progress.
 *
 * @param buckets Array-of-Set representation of learning buckets.
 * @param history representation of user's answer history.
 * @returns an object with progress statistics.
 *          - totalCards: total number of unique flashcards.
 *          - learnedCards: number of cards not in bucket 0.
 *          - bucketDistribution: array of counts of cards per bucket.
 * @spec.requires buckets is a valid Array-of-Set representation.
 */
export function computeProgress(
  buckets: Array<Set<Flashcard>>,
  history: any
): any {
  let totalCards = 0;
  const bucketDistribution: number[] = [];
  for (let i = 0; i < buckets.length; i++) {
    const count = buckets[i]!.size;
    bucketDistribution[i] = count;
    totalCards += count;
  }
  // Consider cards in buckets other than 0 as learned.
  const learnedCards = totalCards - (buckets[0]?.size || 0);
  return {
    totalCards,
    learnedCards,
    bucketDistribution,
  };
}
