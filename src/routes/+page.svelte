<script lang="ts">
	import { dataFields, setupCompleted } from '$lib/storage';
	import type QRCodeStyling from 'qr-code-styling';
	let { amountInEuro, purpose, owner, iban, bic } = dataFields;
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { browser } from '$app/environment';
	import InputField from '$lib/InputField.svelte';

	let qr: QRCodeStyling | null = null;
	let qrContainer: HTMLDivElement | null = null;
	let canShare = false;

	$: canShare =
		browser &&
		typeof navigator !== 'undefined' &&
		typeof navigator.share === 'function' &&
		qr !== null;

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
				backgroundOptions: { color: '#fff' },
				qrOptions: {
					errorCorrectionLevel: 'M'
				}
			});

			// render into container
			qr.append(qrContainer);
		} else {
			qr.update({ data });
		}
	}

	async function createShareImage() {
		if (qr === null) {
			throw new Error('QR code not initialized');
		}

		const qrPNG = await qr.getRawData('png');
		if (!(qrPNG instanceof Blob)) {
			throw new Error('Failed to create PNG share image');
		}

		const loadImage = (src: string) =>
			new Promise<HTMLImageElement>((resolve, reject) => {
				const image = new Image();
				image.onload = () => resolve(image);
				image.onerror = () => reject(new Error('Failed to load QR image'));
				image.src = src;
			});

		const objectUrl = URL.createObjectURL(qrPNG);
		const qrImage = await loadImage(objectUrl).finally(() => URL.revokeObjectURL(objectUrl));

		const amountValue = Number(get(amountInEuro) || 0);
		const purposeValue = get(purpose)?.trim();
		const ibanValue = get(iban)?.replace(/\s+/g, '').trim();
		const formattedIban = ibanValue ? ibanValue.replace(/(.{4})/g, '$1 ').trim() : '';

		const paymentLines = [
			`Amount: ${amountValue.toFixed(2)} EUR`,
			purposeValue ? `Purpose: ${purposeValue}` : 'Purpose: -',
			formattedIban ? `IBAN: ${formattedIban}` : 'IBAN: -'
		];

		const measureCanvas = document.createElement('canvas');
		const measureContext = measureCanvas.getContext('2d');
		if (measureContext === null) {
			throw new Error('Failed to create image context');
		}

		const padding = 16;
		const headerLineHeight = 20;
		const bodyLineHeight = 18;
		const maxTextWidth = Math.max(qrImage.width - padding * 2, 120);

		measureContext.font = '13px system-ui, -apple-system, Segoe UI, sans-serif';
		const wrappedLines: string[] = [];
		for (const line of paymentLines) {
			const words = line.split(' ');
			let currentLine = '';

			for (const word of words) {
				const candidate = currentLine ? `${currentLine} ${word}` : word;
				if (measureContext.measureText(candidate).width <= maxTextWidth) {
					currentLine = candidate;
				} else {
					if (currentLine) {
						wrappedLines.push(currentLine);
					}
					currentLine = word;
				}
			}

			if (currentLine) {
				wrappedLines.push(currentLine);
			}
		}

		const textSectionHeight =
			padding + headerLineHeight + wrappedLines.length * bodyLineHeight + padding;
		const canvas = document.createElement('canvas');
		canvas.width = qrImage.width;
		canvas.height = qrImage.height + textSectionHeight;

		const context = canvas.getContext('2d');
		if (context === null) {
			throw new Error('Failed to create image context');
		}

		// Compose share image with QR and human-readable payment details below.
		context.fillStyle = '#fff';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(qrPNG, 0, 0);

		let y = qrImage.height + padding;
		context.fillStyle = '#111';
		context.font = '600 14px system-ui, -apple-system, Segoe UI, sans-serif';
		context.fillText('Payment details', padding, y);
		y += headerLineHeight;

		context.font = '13px system-ui, -apple-system, Segoe UI, sans-serif';
		for (const line of wrappedLines) {
			context.fillText(line, padding, y);
			y += bodyLineHeight;
		}

		const composedImageBlob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (blob) {
					resolve(blob);
					return;
				}
				reject(new Error('Failed to export share image'));
			}, 'image/png');
		});

		return new File([composedImageBlob], 'epc-qr-payment.png', { type: 'image/png' });
	}

	function buildShareText() {
		const amount = Number(get(amountInEuro) || 0);
		const paymentPurpose = get(purpose)?.trim();
		const accountOwner = get(owner)?.trim();
		const accountIban = get(iban)?.trim();
		const accountBic = get(bic)?.trim();

		const parts = [
			`Hi! Please send ${amount.toFixed(2)} EUR${paymentPurpose ? ` for ${paymentPurpose}` : ''}.`,
			'You can scan the attached Payment QR code with your banking app for your convenience.',
			accountOwner ? `Account owner: ${accountOwner}` : '',
			accountIban ? `IBAN: ${accountIban}` : '',
			accountBic ? `BIC: ${accountBic}` : '',
			'Thank you!'
		].filter(Boolean);

		return parts.join('\n');
	}

	async function share() {
		if (!canShare) {
			return;
		}

		const file = await createShareImage();

		if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
			throw new Error('Sharing files is not supported on this device');
		}

		await navigator.share({
			files: [file],
			title: 'EPC-QR Payment',
			text: buildShareText()
		});
	}

	const unsubscribers: Array<() => void> = [];

	onMount(() => {
		if (!get(setupCompleted)) {
			goto('/setup');
			return;
		}

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
					placeholder="e.g. 0,00"
					step="0.01"
					min="0"
					max="10000"
					inputmode="decimal"
					autofocus
				/>
			</InputField>

			<InputField label="Purpose">
				<input
					type="text"
					placeholder="e.g. Lunch"
					name="purpose"
					bind:value={$purpose}
					maxlength="140"
				/>
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

		{#if canShare}
			<button type="button" on:click={share} class="paper-btn" disabled={!$setupCompleted}>
				Share
			</button>
		{/if}
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
