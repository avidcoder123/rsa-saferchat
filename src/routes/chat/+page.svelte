<script lang="ts">
    import { goto } from "$app/navigation";
    import { db } from "$lib/firebase";
    import { currentChatStore, privateKeyStore, publicKeyStore, userIdStore } from "$lib/stores";
    import { child, get, onValue, ref, set } from "firebase/database";
    import { onMount } from "svelte";
    import { get as getVal } from "svelte/store";

    Notification.requestPermission()

    let chatid = getVal(currentChatStore)
    let privateKey = getVal(privateKeyStore)
    let myPublicKey = getVal(publicKeyStore)
    let myID = getVal(userIdStore)
    if(chatid.length == 0 || myPublicKey.length == 0) {
        goto("/home")
    }

    //Whether you are user 1 or 2 in the chat
    let memberID = 0

    let members: string[] = []

    
    let otherPublicKey = ""

    let otherOnline = false

    let chatList: {
        sender: number,
        text: string,
        verified: boolean
    }[] = []

    const configuration = { iceServers: [] }; // No TURN server specified

    const peerConnection = new RTCPeerConnection(configuration);
    let dataChannel: RTCDataChannel | undefined = undefined

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
    .then(async chat => {

        let offer = await get(child(ref(db), "chats/" + chatid + "/webrtc-offer")).then(x => x.val())
        console.log(offer)
        if(offer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            console.log(peerConnection.remoteDescription)
            let answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            let session = {
                sdp: peerConnection.localDescription!.sdp,
                type: peerConnection.localDescription!.type
            }
            set(ref(db, "chats/" + chatid + "/webrtc-answer"), session)
            set(ref(db, "chats/" + chatid + "/webrtc-offer"), null)

            peerConnection.ondatachannel = (event) => {
                dataChannel = event.channel;

                dataChannel.onmessage = (event) => {
                    const message = event.data;
                    // Handle the received message
                    console.log(message)
                };
            };
        } else {
            let offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)
            let session = {
                sdp: peerConnection.localDescription!.sdp,
                type: peerConnection.localDescription!.type
            }
            await set(ref(db, "chats/" + chatid + "/webrtc-offer"), session)

            onValue(ref(db, "chats/" + chatid + "/webrtc-answer"), x => {
                let answer = x.val()
                console.log(answer)
                if(!answer) return
                peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
                .then(() => {
                    return set(ref(db, "chats/" + chatid + "/webrtc-answer"), null)
                }).then(() => {
                    dataChannel = peerConnection.createDataChannel(chatid)
                    dataChannel.send("Hola Haiwan")
                })
            })
        }

        //If there's no offer, then send a WebRTC offer
        // onValue(ref(db, "chats/" + chatid + "/webrtc-offer"), x => {
        //     if(!offerer) {
        //         let offer = x.val()
        //         if(offer) {
        //             peerConnection.setRemoteDescription(offer).then(() => {
        //                 return peerConnection.createAnswer();
        //             }).then((answer) => {
        //                 return peerConnection.setLocalDescription(answer);
        //             }).then(() => {
        //                 set(ref(db, "chats/" + chatid + "/webrtc-answer"), peerConnection.localDescription)
        //             })
        //         } else {
        //             peerConnection.createOffer().then((offer) => {
        //                 return peerConnection.setLocalDescription(offer);
        //             }).then(() => {
        //             // Send the offer to the other peer via Firebase
        //                 set(ref(db, "chats/" + chatid + "/webrtc-offer"), peerConnection.localDescription)
        //                 offerer = true
        //             })
        //         }
        //     }
        // }, {
        //     onlyOnce: true
        // })

        //TODO: If the offerer, on the receiving of the answer, se the local Description.
        //Continued instructions in ChatGPT.
        //Event handlers



        onValue(ref(db, `chats/${chatid}/chat${memberID}`), x => {

            let msg = x.val()
            let decryptedMsg = cryptico.decrypt(msg, privateKey)
            chatList = [...chatList, ({
                sender: memberID == 1 ? 2 : 1,
                text: decodeURI(decryptedMsg.plaintext),
                verified: decryptedMsg.signature == "verified" && decryptedMsg.publicKeyString == otherPublicKey
            })]
            if (Notification.permission === "granted" && !document.hasFocus()) {
                const notification = new Notification("New unread message");
            }
            let msgbox = document.getElementById("scrollTo")!
            msgbox.scrollIntoView();
        })

        setInterval(() => {
            set(ref(db, `chats/${chatid}/ping${memberID}`), Date.now())
        }, 1000)

        setInterval(async () => {
            let x = await get(child(ref(db), `chats/${chatid}/ping${memberID == 1 ? 2 : 1}`))
            let time = parseInt(x.val())
            if(Date.now() - time < 1000) {
                otherOnline = true
            } else {
                otherOnline = false
            }
        }, 1000)
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

    function file() {
        
    }

</script>
<div class="fixed top-0 items-center justify-center flex w-full h-10 bg-slate-700">
    <h1 class="text-white text-xl text-center">
        {members[memberID == 1 ? 1 : 0]}
        <div class={"badge badge-" + (otherOnline ? "success" : "error")}>{otherOnline ? "Online" : "Offline"}</div>
    </h1>
</div>
<div class="flex flex-col gap-1 overflow-y-auto mb-12 pb-1 mt-10" id="messageslist">
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
