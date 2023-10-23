<script lang="ts">
    import { goto } from "$app/navigation";
    import { db } from "$lib/firebase";
    import { currentChatStore, privateKeyStore, publicKeyStore, userIdStore } from "$lib/stores";
    import { child, get, onValue, ref, set } from "firebase/database";
    import { onMount } from "svelte";
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
        // if(chat) {
        //     let encryptedMsg = chat["chat" + memberID] as string
        //     let decryptedMsg = cryptico.decrypt(encryptedMsg, privateKey)
        //     console.log(decryptedMsg)
        //     chatList = [...chatList, ({
        //         sender: memberID == 1 ? 2 : 1,
        //         text: decodeURI(decryptedMsg.plaintext),
        //         verified: decryptedMsg.signature == "verified" && decryptedMsg.publicKeyString == otherPublicKey
        //     })]
        // }

        onValue(ref(db, `chats/${chatid}/chat${memberID}`), x => {
            let msg = x.val()
            let decryptedMsg = cryptico.decrypt(msg, privateKey)
            chatList = [...chatList, ({
                sender: memberID == 1 ? 2 : 1,
                text: decodeURI(decryptedMsg.plaintext),
                verified: decryptedMsg.signature == "verified" && decryptedMsg.publicKeyString == otherPublicKey
            })]
            let msgbox = document.getElementById("scrollTo")!
            msgbox.scrollIntoView();
        })
    })

    onMount(() => {
        document.getElementById("chatbox")!.addEventListener("keypress", function(event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("submit")!.click();
        }
        });
    })
    let chatText = "" 

    function sendMsg() {
        if(!chatText) return
        chatList = [...chatList, {
            sender: memberID,
            text: chatText,
            verified: true
        }]
        let cipher = cryptico.encrypt(encodeURI(chatText), otherPublicKey, privateKey).cipher!
        set(ref(db, `chats/${chatid}/chat${memberID == 1 ? 2 : 1}`), cipher).then(() => chatText = "")
        .then(() => {
            let msgbox = document.getElementById("scrollTo")!
            msgbox.scrollIntoView();
        })

    }

</script>
<div class="flex flex-col gap-1 overflow-y-auto mb-12 pb-1" id="messageslist">
    {#each chatList as msg}
        <div class={"alert " + (msg.sender == memberID ? "alert-success" : "")}>
            <div>
            <h3 class="font-bold">
                {msg.sender == memberID ? "You" : members[msg.sender - 1]}
                {#if msg.sender != memberID}
                    {#if msg.verified}
                        <div class="badge badge-success">Verified</div>
                    {:else}
                        <div class="badge badge-error">Signature forged! The message may have been sent by a hacker!</div>
                    {/if}
                {/if}
            </h3>
            <div class="text-lg">{msg.text}</div>
            </div>
        </div>
    {/each}
    <span id="scrollTo"></span>
</div>
<div class="flex flex-row fixed bottom-0 w-full h-12">
    <input class="w-[85%] h-12 pl-2" placeholder="Enter message" id="chatbox" bind:value={chatText} autofocus/>
    <button class="w-[15%] h-12 bg-success text-black text-lg" id="submit" on:click={sendMsg}>Send</button>
</div>
