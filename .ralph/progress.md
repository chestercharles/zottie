# zottie Development Progress

## 2026-01-18

### Shopping List Swipe UX Fixes
- Changed swipe action from ellipsis icon with primary color to trash icon with red background (follows iOS delete pattern)
- Fixed row getting stuck after action sheet dismissal - row now animates back to closed position when Cancel is tapped or sheet dismissed
- Implementation: Added `onComplete` callback pattern so parent can reset row state after action sheet closes

### Assistant Chat Action History
- Action results now persist in chat history after user confirms or cancels proposed actions
- Shows action summary, individual action details, and outcome (confirmed/cancelled/error)
- Cancelled actions show with strikethrough text
- Fixed empty message bubble appearing when assistant only returns proposed actions (no text)

Commit: 4bf648b
