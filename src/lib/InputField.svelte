<script lang="ts">
	import type { Snippet } from 'svelte';
	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<label class="input-field">
	<span class="label-text">{label}</span>
	{@render children()}
</label>

<style>
	.input-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-align: center;
	}

	:global(.input-field input) {
		font-size: 1em;
		padding: 0.75em;
		text-align: center;
		border-radius: 200px;
		border-color: currentColor;
		color: inherit;
	}
</style>
