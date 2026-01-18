# zottie Development Progress

## 2026-01-17: Include last purchase date in Assistant context

Implemented the "(Assistant Epic) Include last purchase date in Assistant context" feature.

### Changes

- Modified `apps/api/src/endpoints/assistantChat.ts`:
  - Added `formatItemWithPurchaseDate()` helper function that formats items with human-readable purchase dates (e.g., "milk (purchased yesterday)", "eggs (purchased 2 weeks ago)")
  - Updated `buildPantryContext()` to include purchase dates for items that have been purchased (in_stock and running_low items)
  - Purchase date display uses friendly relative time: "today", "yesterday", "X days ago", "X weeks ago", "X months ago"

### How it works

The AI Assistant now receives context like:

```
Current pantry inventory:
In stock (3): milk (purchased yesterday), eggs (purchased 3 days ago), bread
Running low (2): butter (purchased 2 weeks ago), flour
Out of stock (1): coffee
```

This allows the assistant to make better recommendations when users ask questions like "should I buy more milk?" - it can factor in when items were last purchased to assess freshness.
