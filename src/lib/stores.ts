import { writable } from "svelte/store";

export let privateKeyStore = writable()
export let publicKeyStore = writable("")
export let userIdStore = writable("")
export let currentChatStore = writable("")