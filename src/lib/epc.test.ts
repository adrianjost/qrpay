import { describe, it, expect } from 'vitest';
import { buildEpcPayload, formatEpcAmount, validateIban, validateBic } from './epc';

// ────────────────────────────────────────────────────────────────
// formatEpcAmount
// ────────────────────────────────────────────────────────────────
describe('formatEpcAmount', () => {
	it('returns empty string for zero amount', () => {
		expect(formatEpcAmount(0)).toBe('');
	});

	it('returns empty string for negative amounts', () => {
		expect(formatEpcAmount(-5)).toBe('');
	});

	it('formats a whole number with two decimal places', () => {
		expect(formatEpcAmount(10)).toBe('EUR10.00');
	});

	it('formats a one-decimal amount with two decimal places', () => {
		expect(formatEpcAmount(9.5)).toBe('EUR9.50');
	});

	it('formats a two-decimal amount correctly', () => {
		expect(formatEpcAmount(12.34)).toBe('EUR12.34');
	});

	it('formats a value with exactly 2 decimal places', () => {
		expect(formatEpcAmount(1.1)).toBe('EUR1.10');
	});
});

// ────────────────────────────────────────────────────────────────
// buildEpcPayload
// ────────────────────────────────────────────────────────────────
describe('buildEpcPayload', () => {
	const base = {
		bic: 'BYLADEM1001',
		owner: 'John Doe',
		iban: 'DE02120300000000202051',
		amountInEuro: 12.5,
		purpose: 'Lunch'
	};

	it('produces 11 lines when the optional beneficiary field is empty', () => {
		const payload = buildEpcPayload(base);
		expect(payload.split('\n')).toHaveLength(11);
	});

	it('starts with the EPC service tag BCD', () => {
		expect(buildEpcPayload(base).startsWith('BCD\n')).toBe(true);
	});

	it('uses version 002', () => {
		const lines = buildEpcPayload(base).split('\n');
		expect(lines[1]).toBe('002');
	});

	it('uses UTF-8 charset code 1', () => {
		const lines = buildEpcPayload(base).split('\n');
		expect(lines[2]).toBe('1');
	});

	it('uses SCT identification', () => {
		const lines = buildEpcPayload(base).split('\n');
		expect(lines[3]).toBe('SCT');
	});

	it('includes BIC on line 5', () => {
		const lines = buildEpcPayload(base).split('\n');
		expect(lines[4]).toBe('BYLADEM1001');
	});

	it('includes owner name on line 6', () => {
		const lines = buildEpcPayload(base).split('\n');
		expect(lines[5]).toBe('John Doe');
	});

	it('strips whitespace from IBAN on line 7', () => {
		const lines = buildEpcPayload({ ...base, iban: 'DE02 1203 0000 0000 2020 51' }).split('\n');
		expect(lines[6]).toBe('DE02120300000000202051');
	});

	it('formats amount with 2 decimal places on line 8', () => {
		const lines = buildEpcPayload(base).split('\n');
		expect(lines[7]).toBe('EUR12.50');
	});

	it('leaves amount field empty when amount is zero', () => {
		const lines = buildEpcPayload({ ...base, amountInEuro: 0 }).split('\n');
		expect(lines[7]).toBe('');
	});

	it('places purpose text on line 11', () => {
		const lines = buildEpcPayload(base).split('\n');
		expect(lines[10]).toBe('Lunch');
	});

	it('does not end with a trailing newline', () => {
		const payload = buildEpcPayload(base);
		expect(payload.endsWith('\n')).toBe(false);
	});
});

// ────────────────────────────────────────────────────────────────
// validateIban
// ────────────────────────────────────────────────────────────────
describe('validateIban', () => {
	it('returns null for a valid German IBAN', () => {
		expect(validateIban('DE02120300000000202051')).toBeNull();
	});

	it('accepts IBANs with spaces', () => {
		expect(validateIban('DE02 1203 0000 0000 2020 51')).toBeNull();
	});

	it('returns null for a string shorter than 4 chars (not yet validatable)', () => {
		expect(validateIban('DE')).toBeNull();
	});

	it('returns an error for an IBAN with bad checksum', () => {
		expect(validateIban('DE00120300000000202051')).not.toBeNull();
	});

	it('returns an error for an IBAN with invalid characters', () => {
		expect(validateIban('DE02 XXXX XXXX XXXX XXXX XX')).not.toBeNull();
	});
});

// ────────────────────────────────────────────────────────────────
// validateBic
// ────────────────────────────────────────────────────────────────
describe('validateBic', () => {
	it('returns null for empty string (BIC is optional)', () => {
		expect(validateBic('')).toBeNull();
	});

	it('returns null for a valid 8-character BIC', () => {
		expect(validateBic('BYLADEM1')).toBeNull();
	});

	it('returns null for a valid 11-character BIC', () => {
		expect(validateBic('BYLADEM1001')).toBeNull();
	});

	it('accepts BIC with spaces', () => {
		expect(validateBic('BYLAD EM1 001')).toBeNull();
	});

	it('returns an error for a BIC of wrong length', () => {
		expect(validateBic('BYLAD')).not.toBeNull();
	});

	it('returns an error for a BIC with invalid characters', () => {
		expect(validateBic('BYLÄ DEM1')).not.toBeNull();
	});
});
