<script lang="ts">
	import InputField from '$lib/InputField.svelte';
	import { dataFields } from '$lib/storage';
	let { owner, iban, bic } = dataFields;
</script>

<svelte:head>
	<title>Setup</title>
	<meta name="description" content="Setup your account" />
</svelte:head>

<form class="layout-inputs">
	<h1>Setup</h1>
	<InputField label="Account Owner">
		<input type="text" name="owner" bind:value={$owner} />
	</InputField>
	<InputField label="IBAN">
		<input type="text" name="iban" bind:value={$iban} />
	</InputField>
	<InputField label="BIC">
		<input type="text" name="bic" bind:value={$bic} />
	</InputField>
</form>

<style>
	h1 {
		text-align: center;
		margin: 0 auto 1rem;
		font-size: 2rem;
		text-align: center;
		font-weight: bold;
	}
	.layout-inputs {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
