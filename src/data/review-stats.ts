// Single source of truth for the directory's public-facing numbers.
//
// Anything that displays a review count, a decline rate, the subscriber
// figure, or the queue length should import from here rather than hardcoding
// it. The whole point of publishing these numbers is that they hold up when
// someone checks them, and they stop holding up the moment two pages disagree.
//
// UPDATE THIS FILE as you work through the review queue.

/** Submissions reviewed and published. */
export const PUBLISHED = 58;

/** Submissions reviewed and declined, with the submitter notified. */
export const DECLINED = 31;

/** Tools currently waiting in the free queue, not yet reviewed. This is the
 *  "N tools waiting ahead of you" figure on the submit page. Update it as the
 *  backlog grows or clears. */
export const QUEUE_COUNT = 150;

/** Newsletter subscribers. Keep in step with the promote page and Ghost. */
export const SUBSCRIBERS = '2,000+';

/** Date the numbers above were last checked. Shown publicly. */
export const STATS_UPDATED = 'August 31, 2026';

// --- Derived. Do not edit by hand. ---

/**
 * Reviewed means a decision was made either way. Tools still sitting in the
 * free queue are deliberately excluded, because a queue is not a judgement and
 * counting them would inflate the decline rate.
 */
export const REVIEWED = PUBLISHED + DECLINED;

/** Whole-number percentage of reviewed submissions that were declined. */
export const DECLINE_RATE = Math.round((DECLINED / REVIEWED) * 100);

/** Rounded "1 in N" phrasing for short strip copy. */
export const DECLINE_RATIO = Math.round(REVIEWED / DECLINED);

/**
 * The position a tool submitting right now would land at: one behind everyone
 * already waiting. Use this for the "you land at #173" copy so the number is
 * always QUEUE_COUNT + 1 and can never drift from the headline figure.
 */
export const QUEUE_NEXT_POSITION = QUEUE_COUNT + 1;
