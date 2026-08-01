/**
 * Builds an EPC-QR (EPC069-12) payload string from payment fields.
 *
 * Format: 12 lines joined by LF (no trailing newline).
 * Spec: https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation
 */
export function buildEpcPayload(fields: {
	bic: string;
	owner: string;
	iban: string;
	amountInEuro: number;
	purpose: string;
}): string {
	const { bic, owner, iban, amountInEuro, purpose } = fields;

	const lines = [
		// 1: Service Tag (fixed)
		'BCD',
		// 2: Version
		'002',
		// 3: Character set - 1 = UTF-8
		'1',
		// 4: Identification
		'SCT',
		// 5: BIC - optional for version 002
		bic,
		// 6: Name (max 70)
		owner,
		// 7: IBAN (strip whitespace)
		iban.replace(/\s+/g, ''),
		// 8: Amount - EURx.xx with 2dp, or empty if zero
		formatEpcAmount(amountInEuro),
		// 9: Local purpose - leave empty
		'',
		// 10: Remittance (structured) - leave empty
		'',
		// 11: Remittance (text)
		purpose,
		// 12: Beneficiary to originator info - leave empty
		''
	];

	return lines.join('\n').replace(/\n+$/, '');
}

/**
 * Formats an amount for the EPC QR amount field.
 * Returns `EUR` followed by the amount to exactly 2 decimal places,
 * or an empty string if the amount is zero or negative (amount is optional per spec).
 */
export function formatEpcAmount(amountInEuro: number): string {
	return amountInEuro > 0 ? `EUR${amountInEuro.toFixed(2)}` : '';
}

/**
 * Validates an IBAN using the MOD-97 checksum algorithm.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateIban(value: string): string | null {
	const raw = value.replace(/\s+/g, '').toUpperCase();
	if (raw.length < 4) return null; // too short to validate yet
	if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(raw)) return 'Invalid IBAN format.';
	// Move first 4 chars to end, convert letters to numbers (A=10…Z=35), then MOD-97
	const rearranged = raw.slice(4) + raw.slice(0, 4);
	const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
	let remainder = 0;
	for (const char of numeric) {
		remainder = (remainder * 10 + parseInt(char)) % 97;
	}
	return remainder === 1 ? null : 'IBAN checksum is invalid. Please double-check.';
}

/**
 * Validates a BIC/SWIFT code.
 * Returns null if valid or empty (BIC is optional), or an error message string if invalid.
 */
export function validateBic(value: string): string | null {
	const raw = value.replace(/\s+/g, '').toUpperCase();
	if (raw.length === 0) return null;
	return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(raw)
		? null
		: 'Invalid BIC format (e.g. BYLADEM1001).';
}
