<script>
    import { goto } from "$app/navigation";
    import { privateKeyStore, publicKeyStore } from "$lib/stores"
    import { get as getVal } from "svelte/store"
    if(getVal(publicKeyStore).length == 0) {
        goto("/")
    }
</script>