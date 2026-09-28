<script lang="ts">
    import ListRow from './ListRow.svelte'

    let { user }: {
        user: {
            username: string,
            firstname: string,
            lastname: string,
            memberships: { groupId: number, admin: boolean, group: { name: string } }[],
        },
    } = $props()

    let initials = $derived(`${user.firstname.at(0) ?? ''}${user.lastname.at(0) ?? ''}`.toUpperCase())
</script>

<ListRow href="/users/{user.username}">
    {#snippet lead()}
        <span
            class="flex size-10 items-center justify-center rounded-full bg-(--surface-hover) text-sm font-semibold text-(--text-secondary)"
        >
            {initials}
        </span>
    {/snippet}

    {#snippet main()}
        <h3 class="m-0 truncate text-base font-medium text-(--text)">
            {user.firstname} {user.lastname}
        </h3>
        <p class="m-0 truncate text-sm text-(--text-secondary)">@{user.username}</p>
    {/snippet}

    {#snippet meta()}
        {#each user.memberships.slice(0, 2) as membership (membership.groupId)}
            <span class="max-w-full truncate">
                {membership.group.name}{membership.admin ? ' ★' : ''}
            </span>
        {/each}
    {/snippet}
</ListRow>
