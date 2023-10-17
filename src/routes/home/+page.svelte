<script lang="ts">
    import { goto } from "$app/navigation";
    import { db } from "$lib/firebase";
    import { privateKeyStore, publicKeyStore, userIdStore } from "$lib/stores"
    import { child, get, onValue, push, ref, set } from "firebase/database";
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

    let userChats: any[] = []
    onValue(ref(db, `users/${ownID}/chats`), async x => {
        let val = x.val()
        let obj = Object.values(val)
        let ids = obj.map((n: any) => n.id)
        let things = await Promise.all(ids.map(n => get(child(ref(db), `chats/${n}`))))
        userChats = things.map((y, idx) => ({...y.val(), id: ids[idx]}))
        console.log(userChats)
    })


    function deleteChat(chatID: string) {
        if(confirm("Are you sure?")){
            set(ref(db, `chats/${chatID}`), null)
            .then(() => {
                return get(child(ref(db), `users/${ownID}/chats`)).then(x => x.val())
            })
            .then(val => {
                for(let key in val) {
                    if (val[key] == chatID) {
                        set(ref(db, `users/${ownID}/chats/${chatID}`), null)
                        break
                    }
                }
            })
            .then(() => {
                let u1 = chatID.slice(0, chatID.length / 2)
                let u2 = chatID.slice(chatID.length / 2, chatID.length)
                let id = ""
                if(u1 == ownID) {
                    id = u2
                } else {
                    id = u1
                }
                return get(child(ref(db), `/user/${id}/chats`)).then(x => x.val())
            })
            .then(val => {
                let u1 = chatID.slice(0, chatID.length / 2)
                let u2 = chatID.slice(chatID.length / 2, chatID.length)
                let id = ""
                if(u1 == ownID) {
                    id = u2
                } else {
                    id = u1
                }
                for(let key in val) {
                    if (val[key] == chatID) {
                        set(ref(db, `users/${id}/chats/${chatID}`), null)
                        break
                    }
                }
            })
        }
    }
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
        {#each chatList as chat}
        <div class="alert">
            <div>
                {#if chat.member1 == ownID}
                    <h3 class="font-bold">{chat.member2}</h3>
                {:else}
                    <h3 class="font-bold">{chat.member1}</h3>
                {/if}
              <!-- In the future, add alias here -->
              <!-- <div class="text-xs">{alias}</div> -->
            </div>
            <button class="btn btn-sm bg-cyan-800">Open Chat</button>
            <button class="btn btn-sm bg-red-700" on:click={() => deleteChat(chat.id)}>Delete Chat</button>
          </div>
        {/each}
    {/await}
</div>