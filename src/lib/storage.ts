import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * A Svelte store that automatically persists its state in localStorage.
 * SSR-safe: does not touch localStorage on the server.
 *
 * @param key - The key to store the data under in localStorage.
 * @param initial - The default value to use if nothing is stored yet.
 * @returns A writable Svelte store that persists its data in localStorage.
 */
export function persistedState<T>(key: string, initial: T) {
	// Start with the initial value on the server (SSR) and before hydration.
	const store = writable<T>(initial);

	if (browser) {
		// On the client, try to hydrate from localStorage.
		try {
			const stored = localStorage.getItem(key);
			if (stored != null) {
				store.set(JSON.parse(stored));
			}
		} catch (err) {
			console.warn(`Failed to read ${key} from localStorage`, err);
		}

		// Sync store updates to localStorage on the client.
		store.subscribe((value) => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch (err) {
				console.error(`Failed to persist ${key} to localStorage`, err);
			}
		});
	}

	return store;
}

export const dataFields = {
	owner: persistedState('owner', ''),
	iban: persistedState('iban', ''),
	bic: persistedState('bic', ''),
	amountInEuro: persistedState('amountInEuro', 0.0),
	purpose: persistedState('purpose', '')
};

import { derived } from 'svelte/store';
export const setupCompleted = derived(
	[dataFields.owner, dataFields.iban],
	([$owner, $iban]) => $owner !== '' && $iban !== ''
);
