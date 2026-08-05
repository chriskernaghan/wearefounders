// Single source of truth for the directory's public-facing numbers.
//
// Anything that displays a review count, a decline rate, or the subscriber
// figure should import from here rather than hardcoding it. The whole point of
// publishing these numbers is that they hold up when someone checks them, and
// they stop holding up the moment two pages disagree.
//
// UPDATE THIS FILE as you work through the review queue.

/** Submissions reviewed and published. */
export const PUBLISHED = 51;

/** Submissions reviewed and declined, with the submitter notified. */
export const DECLINED = 13;

/** Newsletter subscribers. Keep in step with the promote page and Ghost. */
export const SUBSCRIBERS = '2,000+';

/** Date the numbers above were last checked. Shown publicly. */
export const STATS_UPDATED = 'August 5, 2026';

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
