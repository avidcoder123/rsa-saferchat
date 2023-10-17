<script lang="ts">
    import { goto } from "$app/navigation";
    import { db } from "$lib/firebase";
    import { privateKeyStore, publicKeyStore, userIdStore } from "$lib/stores"
    import { child, get, push, ref, set } from "firebase/database";
    import { get as getVal } from "svelte/store"

    let ownID = getVal(userIdStore)

    if(getVal(publicKeyStore).length == 0) {
        goto("/")
    }

    let receiverID = "", initMsg = ""

    async function chatRequest() {
        let receiver = await get(child(ref(db), `users/${receiverID}`)).then(x => x.val())
        if(!receiver) return alert("Invalid Receiver ID. Check your spelling.")
        //Encrypt the hello message
        let encrypted = cryptico.encrypt(initMsg, receiver.publicKey, getVal(privateKeyStore)).cipher!
        let chatname = ""
        //Put ownerIDs in alphabetical order
        if(ownID < receiverID) {
            chatname = ownID + receiverID
        } else {
            chatname = receiverID + ownID
        }
        //Create initial message
        await set(ref(db, `/chats/${chatname}`), {
            member1: ownID,
            member2: receiverID,
            chat2: encrypted //Send message to member 2
        })
        //Add chat to each user's list
        await set(push(ref(db, `users/${ownID}/chats`)), {id: chatname})
        await set(push(ref(db, `users/${receiverID}/chats`)), {id: chatname})
        receiverID = ""
        initMsg = ""
    }

    let userChats = get(child(ref(db), `users/${ownID}/chats`))
    .then(x => x.val())
    .then(Object.values)
    .then(obj => obj.map(x => x.id))
    .then(obj => Promise.all(obj.map(x => get(child(ref(db), `chats/${x}`)))))
    .then(x => Promise.all(x.map(y => y.val())))
</script>
<div class="p-5 flex flex-col gap-3">
    <h1 class="text-white text-4xl">Your User ID is {ownID}</h1>
    <hr>
    <h1 class="text-white text-3xl">Send a chat request</h1>
    <input class="h-10 rounded-md border-white border-2 w-72 p-1" bind:value={receiverID} placeholder="Receiver ID">
    <textarea class="h-52 rounded-md border-white border-2 w-72 p-1" bind:value={initMsg} placeholder="Initial Message"></textarea>
    <button class="h-10 w-52 bg-blue-600 rounded-md p-1 text-white" on:click={chatRequest}>Send Chat Request</button>
    <hr>
    {#await userChats then chatList}
        <h1 class="text-white text-3xl">{JSON.stringify(chatList)}</h1>
    {/await}
</div>