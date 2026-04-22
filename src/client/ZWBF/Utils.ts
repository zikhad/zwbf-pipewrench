/**
 * Given a percentage and an arbitrary number, returns the corresponding number between 0 and the number
 * @param percentage the percentage to be converted into an arbirary number
 * @param maxNumber the number that represents the Max
 * @returns
 */
export const percentageToNumber = (percentage: number, maxNumber: number) => {
	percentage = Math.min(100, percentage);
	percentage = Math.max(0, percentage);
	return Math.floor((percentage / 100) * maxNumber);
};

/**
 * Applies a positive delta to a value with optional upper bound,
 * ensuring the result never decreases below the current value.
 *
 * This is the core invariant for effect application:
 * - Values are only increased (never reduced)
 * - A delta is added to the current value
 * - The result can be capped by `max` if provided
 *
 * @param current - The current value.
 * @param delta - The amount to add. Negative values are effectively ignored.
 * @param max - Optional upper bound for the resulting value.
 * @returns The updated value, guaranteed to be >= current.
 */
export const increaseClamped = (
	current: number,
	delta: number,
	max?: number
): number => {
	const next = current + Math.max(0, delta);
	const bounded = max !== undefined ? Math.min(max, next) : next;
	return Math.max(current, bounded);
}
