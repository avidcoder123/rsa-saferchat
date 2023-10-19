<script lang="ts">
    import { goto } from "$app/navigation";
    import { db } from "$lib/firebase";
    import { currentChatStore, privateKeyStore, publicKeyStore, userIdStore } from "$lib/stores";
    import { child, get, ref } from "firebase/database";
    import { get as getVal } from "svelte/store";

    let chatid = getVal(currentChatStore)
    let privateKey = getVal(privateKeyStore)
    let myPublicKey = getVal(publicKeyStore)
    let myID = getVal(userIdStore)
    if(chatid.length == 0 || myPublicKey.length == 0) {
        goto("/")
    }

    //Whether you are user 1 or 2 in the chat
    let memberID = 0

    let chatPromise = get(child(ref(db), "chats/" + chatid)).then(x => x.val())
    let otherPublicKey = ""

    let chatList: {
        sender: number,
        text: string,
        verified: boolean
    }[] = []

    chatPromise.then(c => {
        let otherID = ""
        if(c.member1 == myID) {
            memberID = 1
            otherID = c.member2
        } else {
            memberID = 2
            otherID = c.member1
        }

        return get(child(ref(db), "users/" + otherID)).then(x => x.val())
    }).then(user => otherPublicKey = user.publicKey)
    .then(() => get(child(ref(db), "chats/" + chatid)).then(x => x.val()))
    .then(chat => {})

</script>
{#await chatPromise then chat}
    <h1 class="text-white">{otherPublicKey}</h1>
{/await}