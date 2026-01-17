# mobile agents.md

## iOS UX/UI patterns

Features should be implemented consistently with iOS native design patterns. Prefer iOS-native UI components and interaction patterns over custom or cross-platform alternatives:

- Use bottom sheets instead of full-screen modals for quick actions
- Use action sheets for contextual menus triggered by swipe or long-press
- Use swipe gestures for revealing actions on list items
- Place primary actions in the navigation header bar rather than floating action buttons
- Follow iOS conventions for dismiss gestures (swipe down, tap backdrop)

### Expo Router navigation headers

With nested navigators (Tabs containing Stacks), define headers at the Tab level to avoid icon flash on tab switches. For sub-screens within a Stack that would create double headers, use `presentation: 'modal'` to present them over the Tab header rather than trying to dynamically hide/show parent headers with `navigation.getParent()?.setOptions()`. When screens need working header button callbacks, use `useLayoutEffect` with `navigation.getParent()?.setOptions()` to inject the handlers from the screen component.

### Implementing native-feeling interactions

Before hand-rolling gesture-driven UI (bottom sheets, drawers, pickers), check if a mature library exists. Custom implementations often miss subtle iOS behaviors that users notice subconsciously.

**Use established libraries when available:**

- Bottom sheets: `@gorhom/bottom-sheet` (keyboard avoidance, spring physics, snap points)
- Date/time pickers: `@react-native-community/datetimepicker`
- Action sheets: `ActionSheetIOS` (already native)

**When you must build custom interactions:**

- Use `withSpring` not `withTiming` for gesture-driven animations—iOS uses spring physics everywhere
- Incorporate gesture velocity into animations (the `velocityY` from pan gestures should influence the spring)
- Handle keyboard appearance—content should shift to remain visible
- Test on device, not just simulator—timing/physics feel different with real touch input

**Signs you're over-engineering:**

- Managing multiple `useSharedValue` for what should be a single component's state
- Writing gesture handlers that a library would provide
- Animating backdrop + content + gestures separately when they should move together

## Code organization

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
  select: (items) => items.filter((item) => item.status !== 'in_stock'),
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

## Design System

@DESIGN_SYSTEM.md

### Using Design System Components

Import components and the theme hook:

```typescript
import { Text, Button, Card, TextInput, StatusBadge, ListItem, EmptyState } from '@/components'
import { useTheme } from '@/lib/theme'
```

Access theme tokens in your component:

```typescript
const { colors, spacing, radius, typography } = useTheme()
```

Always use semantic tokens instead of hardcoded values:

```typescript
// Good
<View style={{ backgroundColor: colors.surface.background, padding: spacing.md }}>
  <Text variant="title.medium">Hello</Text>
  <Button variant="primary" title="Continue" onPress={handlePress} />
</View>

// Bad - never use hardcoded colors or spacing
<View style={{ backgroundColor: '#fff', padding: 16 }}>
```
