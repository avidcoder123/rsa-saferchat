<script>
    import { goto } from "$app/navigation";
    import { db } from "$lib/firebase";
    import { privateKeyStore, publicKeyStore, userIdStore } from "$lib/stores"
    import { child, get, ref } from "firebase/database";
    import { get as getVal } from "svelte/store"
    if(getVal(publicKeyStore).length == 0) {
        goto("/")
    }

    let receiverID = "", initMsg = ""

    async function chatRequest() {
        let receiver = await get(child(ref(db), `users/${receiverID}`)).then(x => x.val())
        if(!receiver) return alert("Invalid Receiver ID. Check your spelling.")
    }
</script>
<div class="p-5 flex flex-col gap-3">
    <h1 class="text-white text-4xl">Your User ID is {getVal(userIdStore)}</h1>
    <hr>
    <h1 class="text-white text-3xl">Send a chat request</h1>
    <input class="h-10 rounded-md border-white border-2 w-72 p-1" bind:value={receiverID} placeholder="Receiver ID">
    <textarea class="h-52 rounded-md border-white border-2 w-72 p-1" bind:value={initMsg} placeholder="Initial Message"></textarea>
    <button class="h-10 w-52 bg-blue-600 rounded-md p-1 text-white" on:click={chatRequest}>Send Chat Request</button>
    <hr>
</div>