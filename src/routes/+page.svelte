<script lang="ts">
    import { db } from "$lib/firebase"
    import { set, ref, get, child } from "firebase/database";
    import "$lib/cryptico.min.js"
    import { privateKeyStore, publicKeyStore } from "$lib/stores"
    import { goto } from "$app/navigation";

    let login_username = "",
    login_password = "",
    register_username = "",
    register_password = "",
    register_confirm = ""

    function login() {
        const hashedUname = MD5(SHA256(login_username)) //SHA256 to conceal, MD5 to make it a bit shorter
        get(child(ref(db), `users/${hashedUname}`))
        .then(x => x.val())
        .then(val => {
            if(!val) return alert("User doesn't exist")
            if(val.password == SHA256(login_password)) {
                const key = cryptico.generateRSAKey(login_username + login_password, 2048)
                const publicKey = cryptico.publicKeyString(key)
                privateKeyStore.set(key)
                publicKeyStore.set(publicKey)
                return goto("/home")
            } else {
                return alert("Wrong login.")
            }
        })
    }


    async function register() {
        if(register_password != register_confirm) return alert("Passwords do not match.");
        const hashedUname = MD5(SHA256(register_username)) //SHA256 to conceal, ND5 to make it a bit shorter

        let existingUser = await get(child(ref(db), `users/${hashedUname}`)).then(x => x.val())
        if(existingUser) {
            return alert("Username already taken.")
        }
        const key = cryptico.generateRSAKey(register_username + register_password, 2048)
        const publicKey = cryptico.publicKeyString(key)
        await set(ref(db, `users/${hashedUname}`), {
            password: SHA256(register_password),
            publicKey
        })
        privateKeyStore.set(key)
        publicKeyStore.set(publicKey)
        return goto("/home")
    }

</script>

<div class="p-5 flex flex-col gap-3">
    <h1 class="text-4xl text-white">RSA-Saferchat</h1>
    <h1 class="text-2xl text-white">Login</h1>
    <input class="h-10 rounded-md border-white border-2 w-72 p-1" bind:value={login_username} placeholder="Username (Case sensitive)">
    <input class="h-10 rounded-md border-white border-2 w-72 p-1" bind:value={login_password} type="password" placeholder="Password">
    <button class="h-10 w-52 bg-blue-600 rounded-md p-1 text-white" on:click={login} disabled={!login_username || !login_password || login_password.length < 8}>Login (May take a while)</button>
    <h1 class="text-2xl">Register</h1>
    <input class="h-10 rounded-md border-white border-2 w-72 p-1" bind:value={register_username} placeholder="Username (Will be kept private)">
    <input class="h-10 rounded-md border-white border-2 w-72 p-1" bind:value={register_password} type="password" placeholder="Password (At least 8 characters, longer is better)">
    <input class="h-10 rounded-md border-white border-2 w-72 p-1" bind:value={register_confirm} type="password" placeholder="Confirm Password">
    <button class="h-10 w-52 bg-blue-600 rounded-md p-1 text-white" on:click={() => register().then(() => null)} disabled=
    {!register_username || !register_password || !register_confirm || register_password.length < 8}
    >Register (May take a while)</button>
</div>