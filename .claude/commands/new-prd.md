You are helping create a new PRD (Product Requirements Document) entry for zottie.

The user has provided this initial idea: $ARGUMENTS

Your job is to gather enough information to write a clear, actionable PRD that another agent can implement without needing implementation details.

Ask clarifying questions ONE AT A TIME using the AskUserQuestion tool. Focus on:

1. **Who and why** - Who is this feature for? What problem does it solve for them? (Clarify when the motivation isn't obvious from the initial idea)
2. **What** - What exactly should this feature do? What is the core behavior?
3. **Where** - Where in the app does this appear? Which screen(s)?
4. **User interaction** - How does the user trigger/interact with this feature?

Don't ask about edge cases, persistence, or visual behavior - the implementing agent can figure those out from the codebase context.

Stop asking questions when you have enough context to write a description that:

- Explains the problem being solved and for whom
- Clearly describes the feature's core behavior
- Specifies where it appears in the app
- Describes how the user interacts with it

Do NOT include implementation details (no specific components, hooks, or code patterns).

Once you have gathered enough information, write the PRD to `.ralph/prds.json` by:

1. Reading the current file
2. Adding the new PRD object to the array
3. Writing the updated array back

The PRD format is:

```json
{
  "name": "Short descriptive title",
  "description": "Detailed description of the feature behavior, user interaction, and any important edge cases.",
  "completed": false
}
```

After writing, confirm the PRD was added and show the user what was written.
