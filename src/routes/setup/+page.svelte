<script lang="ts">
	import { goto } from '$app/navigation';
	import InputField from '$lib/InputField.svelte';
	import { dataFields, setupCompleted } from '$lib/storage';
	let { owner, iban, bic } = dataFields;
</script>

<svelte:head>
	<title>Setup</title>
	<meta name="description" content="Setup your account" />
</svelte:head>

<form class="layout-inputs">
	<header>
		<h1>Setup</h1>
		<p>All data is only saved in your browser's local storage.</p>
	</header>
	<InputField label="Account Owner">
		<input type="text" name="owner" bind:value={$owner} required />
	</InputField>
	<InputField label="IBAN">
		<input type="text" name="iban" bind:value={$iban} required />
	</InputField>
	<InputField label="BIC">
		<input type="text" name="bic" bind:value={$bic} />
	</InputField>

	<button type="button" class="paper-btn" on:click={() => goto('/')} disabled={!setupCompleted}>
		Done
	</button>
</form>

<style>
	header {
		text-align: center;
	}
	header h1 {
		margin: 0 auto 1rem;
		font-size: 2rem;
		text-align: center;
		font-weight: bold;
	}
	header p {
		margin: 0;
		text-wrap: pretty;
	}
	.layout-inputs {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
