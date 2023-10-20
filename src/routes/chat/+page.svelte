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

    let members: string[] = []

    
    let otherPublicKey = ""

    let chatList: {
        sender: number,
        text: string,
        verified: boolean
    }[] = []

    get(child(ref(db), "chats/" + chatid)).then(x => x.val()).then(c => {
        members = [c.member1, c.member2]
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
{#each chatList as msg}
  <div class="alert">
    <div>
      <h3 class="font-bold">
        {msg.sender == memberID ? "You" : members[msg.sender - 1]}
        {#if msg.verified}
            <div class="badge badge-success">Verified</div>
        {:else}
            <div class="badge badge-error">Signature forged! The message </div>
        {/if}
    </h3>
      <div class="text-lg">{msg.text}</div>
    </div>
  </div>
{/each}