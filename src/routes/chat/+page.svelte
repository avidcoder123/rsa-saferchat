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

    
    let otherPublicKey = ""

    let chatList: {
        sender: number,
        text: string,
        verified: boolean
    }[] = []

    let chatPromise = get(child(ref(db), "chats/" + chatid)).then(x => x.val()).then(c => {
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
    .then(chat => {
        if(chat) {
            let encryptedMsg = chat["chat" + memberID] as string
            let decryptedMsg = cryptico.decrypt(encryptedMsg, privateKey)
            console.log(decryptedMsg)
            chatList = [...chatList, ({
                sender: memberID == 1 ? 2 : 1,
                text: decodeURI(decryptedMsg.plaintext),
                verified: decryptedMsg.signature == "verified"
            })]
        }
    })

</script>
{#await chatPromise}
    {#each chatList as msg}
        <div class="alert alert-success">
            <span>{msg.text}</span>
      </div>
      <div class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <div>
          <h3 class="font-bold">New message!</h3>
          <div class="text-xs">{msg.text}</div>
        </div>
      </div>
    {/each}
{/await}