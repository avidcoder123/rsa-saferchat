import { writable } from "svelte/store";

export let privateKeyStore = writable()
export let publicKeyStore = writable("")