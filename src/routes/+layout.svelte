<script lang="ts">
	import '../app.css';
	import { setupCompleted } from '$lib/storage';
	import { page } from '$app/state';
	let { children } = $props();
</script>

<div class="app">
	<header>
		{#if $setupCompleted}
			<a
				href="/"
				title="Request a payment"
				class="paper-btn{ page.url.pathname === '/' ? ' disabled' : '' }"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					height="24px"
					viewBox="0 -960 960 960"
					width="24px"
					fill="currentColor"
					><path
						d="M440-280v20q0 8 6 14t14 6h40q8 0 14-6t6-14v-20h40q17 0 28.5-11.5T600-320v-120q0-17-11.5-28.5T560-480H440v-40h120q17 0 28.5-11.5T600-560q0-17-11.5-28.5T560-600h-40v-20q0-8-6-14t-14-6h-40q-8 0-14 6t-6 14v20h-40q-17 0-28.5 11.5T360-560v120q0 17 11.5 28.5T400-400h120v40H400q-17 0-28.5 11.5T360-320q0 17 11.5 28.5T400-280h40ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h287q16 0 30.5 6t25.5 17l194 194q11 11 17 25.5t6 30.5v447q0 33-23.5 56.5T720-80H240Z"
					/></svg
				>
			</a>
		{/if}
		<h1>QR Pay</h1>
		{#if $setupCompleted}
			<a
				href="/setup"
				class="paper-btn{ page.url.pathname === '/setup' ? ' disabled' : '' }"
				title="Setup account"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					height="24px"
					viewBox="0 -960 960 960"
					width="24px"
					fill="currentColor"
					><path
						d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Z"
					/></svg
				>
			</a>
		{/if}
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<p>
			Made with 💖 by <a href="https://adrianjost.dev">Adrian Jost</a>
		</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		align-items: center;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
	}
	header h1 {
		margin: 0;
		text-align: center;
		flex-grow: 1;
		font-size: 1.5rem;
	}
	header a {
		display: flex;
		margin: 0;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 1rem;
		width: 100%;
		max-width: 40ch;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
