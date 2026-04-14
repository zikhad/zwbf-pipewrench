/**
 * Sandbox options for ZWBF configuration.
 * The game loads custom sandbox options from sandbox-options.txt into SandboxVars.ZWBF.
 * This module reads those values directly and falls back to defaults when unavailable.
 */

const DEFAULT_OPTIONS = {
	pregnancy: {
		duration: 14 * 24 * 60, // 14 days in minutes
		recovery: 7 // days
	},
	womb: {
		capacity: 1000, // ml
		milkCapacity: 1000 // ml
	},
	milk: {
		expiration: 7, // days
        capacity: 1 // L
	}
};

/**
 * Utility function to safely access nested sandbox options with fallback to defaults.
 * @param selector Function to select the desired option from ZWBFSandboxOptions
 * @param fallback Default value to use if the option is not set in SandboxVars
 * @returns The value from SandboxVars if available, otherwise the provided fallback
 */
const getSandboxOption = <T extends number | string>(
	selector: (options: ZWBFSandboxOptions) => T | undefined,
	fallback: T
): T => {
	const value = selector(SandboxVars?.ZWBF ?? {});
	return value ?? fallback;
};

/**
 * Pregnancy-specific sandbox options.
 */
export const PregnancyOptions = {
	/**
	 * Duration of pregnancy in minutes.
	 * Default: 14 days (20,160 minutes)
	 */
	get duration(): number {
		const days = getSandboxOption<number>(
			options => options.PregnancyDuration,
			DEFAULT_OPTIONS.pregnancy.duration / (24 * 60)
		);
		return days * 24 * 60;
	},

	/**
	 * Recovery time after pregnancy in days.
	 * Default: 7 days
	 */
	get recovery(): number {
		return getSandboxOption<number>(
			options => options.PregnancyRecovery,
			DEFAULT_OPTIONS.pregnancy.recovery
		);
	}
};

/**
 * Womb-specific sandbox options.
 */
export const WombOptions = {
	/**
	 * Maximum capacity of the womb in ml.
	 * Default: 1000 ml
	 */
	get capacity(): number {
		return getSandboxOption<number>(
			options => options.WombMaxCapacity,
			DEFAULT_OPTIONS.womb.capacity
		);
	},

	/**
	 * Recovery time after pregnancy in days.
	 * Default: 7 days
	 */
	get recovery(): number {
		return getSandboxOption<number>(
			options => options.PregnancyRecovery,
			DEFAULT_OPTIONS.pregnancy.recovery
		);
	}
};

/**
 * Milk-specific sandbox options.
 */
export const LactationOptions = {
	/**
	 * Maximum capacity for milk storage in ml.
	 * Default: 1000 ml
	 */
	get capacity(): number {
		return getSandboxOption<number>(
			options => options.MilkCapacity,
			DEFAULT_OPTIONS.milk.capacity
		);
	},

	/**
	 * Days before milk expires.
	 * Default: 7 days
	 */
	get expiration(): number {
		return getSandboxOption<number>(
			options => options.MilkExpiration,
			DEFAULT_OPTIONS.milk.expiration
		);
	},
};
