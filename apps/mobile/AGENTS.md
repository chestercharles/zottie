# mobile agents.md

We like to colocate cohesive code. Instead of organization things in to folders by type (eg. /components, /hooks, /queries), we like to organization things by feature (eg. /onboarding, /profile, /grocery-list, /grocery-item).

Ideally, we could colocate most of the code associated with a screen next to the router file. However, Expo requires that every file in the /app directory is a route. So we can just import the screen from our feature module. All the routes in the /app folder should be very sparse. Our feature modules will probably closely match our routes.

## Package management

We use pnpm.

## Automated testing

We generally don't write any automated UI test for Expo Go apps because they tend to be brittle. We don't have any e2e testing set up for our expo app. You can generally assume that we'll manually test out features that have to be verified through the UI.

If there is self-contained logic that can easily be unit tested without mocks, we highly encourage unit testing.

## Data fetching with React Query

We use `@tanstack/react-query` for server state management. This ensures data stays synchronized across screens without manual refresh.

### Structure

- `lib/query/` - Shared query infrastructure (QueryClient, query keys)
- `features/{feature}/hooks/` - Feature-specific query and mutation hooks

### Query keys

All query keys are defined in `lib/query/keys.ts`. This is the single source of truth. Features import keys from here rather than defining their own.

```typescript
// lib/query/keys.ts
export const queryKeys = {
  pantryItems: (userId: string) => ['pantryItems', userId] as const,
}
```

### Hooks pattern

Each feature has its own hooks that wrap React Query:

- `use{Feature}Items.ts` - Query hook for fetching data
- `use{Feature}Mutations.ts` - Mutation hooks for create/update/delete

Hooks handle auth internally (getting credentials, user ID) so screens don't need to.

### Cache sharing

When multiple features display the same underlying data, they should share a cache key. Use the `select` option to filter data at read-time:

```typescript
// Shopping items are filtered pantry items - same cache, different view
const query = useQuery({
  queryKey: queryKeys.pantryItems(userId),
  queryFn: fetchPantryItems,
  select: (items) => items.filter(item => item.status !== 'in_stock'),
})
```

### Mutations

All mutations should invalidate relevant queries on success:

```typescript
useMutation({
  mutationFn: updateItem,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pantryItems(userId) })
  },
})
```

## Verify changes

1. Run `pnpm run lint` to lint the codebase
2. Run `pnpm run tsc` to check typescript types
3. Run `pnpm run test` to run the tests
