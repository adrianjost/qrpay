<script lang="ts">
	import { dataFields } from '$lib/storage';
	import type QRCodeStyling from 'qr-code-styling';
	let { amountInEuro, purpose, owner, iban, bic } = dataFields;
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import InputField from '$lib/InputField.svelte';

	let qr: QRCodeStyling | null = null;
	let qrContainer: HTMLDivElement | null = null;

	function buildPayload(): string | null {
		// Build EPC-QR (EPC069-12) 12-line payload.
		// Lines (1..12): Service Tag, Version, Charset, Identification, BIC, Name,
		// IBAN, Amount, Purpose, Remittance (structured), Remittance (text), Info

		// Join with LF. Important: last line (12) must NOT end with a newline.
		const lines = [
			// 1: Service Tag (fixed)
			'BCD',
			// 2: Version - use 002 (only EWR) per user's table
			'002',
			// 3: Character set - 1 = UTF-8
			'1',
			// 4: Identification - per EPC-QR most implementations expect 'SCT'.
			'SCT',
			// 5: BIC - optional for version 002; include if provided
			get(bic),
			// 6: Name (max 70)
			get(owner),
			// 7: IBAN
			get(iban).replace(/\s+/g, ''),
			// 8: Amount - optional, format EUR123.45 (use dot)
			`EUR${(get(amountInEuro) || 0).toString()}`,
			// 9: Purpose - leave empty
			'',
			// 10: Remittance (structured)
			'',
			// 11: Remittance (text)
			get(purpose),
			''
		];

		return lines.join('\n');
	}

	async function createOrUpdateQr() {
		if (!qrContainer) return;

		const module = await import('qr-code-styling');
		const QRCodeStyling = module.default || module;

		const data = buildPayload();
		if (data === null) {
			qr = null;
			qrContainer.innerHTML = '';
			return;
		}

		if (!qr) {
			qr = new QRCodeStyling({
				type: 'svg',
				data,
				dotsOptions: { color: '#000', type: 'rounded' },
				cornersSquareOptions: { type: 'extra-rounded', color: '#000' },
				cornersDotOptions: { type: 'extra-rounded', color: '#000' },
				backgroundOptions: { color: '#fff' }
			});

			// render into container
			qr.append(qrContainer);
		} else {
			qr.update({ data });
		}
	}

	const unsubscribers: Array<() => void> = [];

	onMount(() => {
		createOrUpdateQr();

		// Subscribe to all fields in dataFields and update QR automatically
		for (const [key, store] of Object.entries(dataFields)) {
			unsubscribers.push(store.subscribe(() => createOrUpdateQr()));
		}
	});

	onDestroy(() => {
		unsubscribers.forEach((u) => u());
		if (qrContainer) qrContainer.innerHTML = '';
	});
</script>

<svelte:head>
	<title>QR Pay</title>
	<meta name="description" content="Generate QR Codes for SEPA payments" />
</svelte:head>

<section class="request-payment">
	<h2>Request a payment</h2>

	<div class="form">
		<div class="inputs">
			<InputField label="Amount in Euro">
				<input
					type="number"
					name="amountInEuro"
					bind:value={$amountInEuro}
					step="0.01"
					min="0"
					max="10000"
					inputmode="decimal"
				/>
			</InputField>

			<InputField label="Purpose">
				<input type="text" name="purpose" bind:value={$purpose} maxlength="140" />
			</InputField>
		</div>

		<div class="qr-code-wrapper">
			<div class="qr-code" bind:this={qrContainer} aria-hidden="false"></div>
		</div>

		<table>
			<tbody>
				<tr>
					<th scope="row">Amount</th>
					<td>{$amountInEuro || 0} EUR</td>
				</tr>
				<tr>
					<th scope="row">Purpose</th>
					<td>{$purpose || '/'}</td>
				</tr>
				<tr>
					<th scope="row">Owner</th>
					<td>{$owner || '/'}</td>
				</tr>
				<tr>
					<th scope="row">IBAN</th>
					<td>{$iban || '/'}</td>
				</tr>
				<tr>
					<th scope="row">BIC</th>
					<td>{$bic || '/'}</td>
				</tr>
			</tbody>
		</table>
	</div>
</section>

<style>
	h2 {
		margin: 0 auto 1rem;
		font-size: 2rem;
		text-align: center;
		font-weight: bold;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.inputs {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.qr-code-wrapper {
		padding: 0.5rem;
		background-color: #fff;
		margin: 0 auto;
		border-radius: 1rem;
	}
	.qr-code {
		aspect-ratio: 1 / 1;
		width: 100%;
		height: auto;
		max-width: min(80vw, 300px);
		display: grid;
	}
	:global(.qr-code svg) {
		width: 100%;
		height: 100%;
	}
	table {
		text-align: left;
		border-collapse: collapse;
		font-size: var(--font-size-small);
	}
	table th {
		text-align: right;
		padding-right: 1rem;
		font-weight: normal;
		opacity: 0.7;
		vertical-align: top;
	}
	table td {
		text-align: left;
		width: 100%;
	}
	/* switch table to one column layout on small screens */
	@media (max-width: 400px) {
		table,
		tbody,
		tr,
		th,
		td {
			display: block;
			width: 100%;
		}
		table th {
			text-align: left;
			padding: 0;
		}
		table td {
			padding: 0;
			margin-bottom: 0.25em;
		}
	}
</style>
