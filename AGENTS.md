# zottie agents.md

zottie is an application that helps a household coordinate grocery lists, manage their kitchen inventory and efficiently meal prep.

## Stack

zottie is a Expo mobile application with a cloudflare worker as a backend API. We use Auth0 for user authentication. We use cloudflare D1 for data storage, and use Drizzle to interface with it.

## Coding style

Avoid adding code comments. If you truly think an implementation detail is likely to be very confusing for future developers, it is OK to leave a comment explaining why the implementation detail exists.

Keep implementations simple and focused.

**Extend through composition**: Start with simple, inline implementations. As the system grows, prefer adding new modules over modifying existing ones with conditionals. When you find complex if/else branches managing distinct behaviors with separate state, that's a signal to extract each behavior into its own implementation. Connect them with a thin coordination layer that selects the right one. This keeps each behavior focused and lets them evolve independently. Don't abstract prematurely—only split when the conditionals become genuinely complex.

## User experience principles

zottie is built with deep empathy for users. Every interaction should make users feel smart, capable, and in control.

**Meet users where they are**: Be smart about user intent. If a user mentions having an item, add it to their pantry rather than asking if they want to add it. When they say "mark apples as running low" but don't have apples yet, add them with that status. Assume users want to take action when they mention items in context.

**Supportive, never patronizing**: Use a conversational, validating tone that acknowledges user effort and guides them toward success. Never question whether they actually want to do something. Be action-oriented and supportive without being condescending or elitist.

**Errors are guidance**: Replace harsh error messages with helpful, empathetic responses that feel like someone trying to help. Explain why something didn't work and recommend what to do next. Use warm, neutral colors and conversational design - make feedback feel like part of a conversation, not a failure state.

**User control and clarity**: Always provide clear ways for users to control their experience. Include skip buttons for optional steps. Allow manual control alongside automatic behaviors. Provide clear visual feedback about what's happening.

**Subtle, warm interactions**: Follow iOS design patterns with gentle, continuous animations using spring physics. Avoid jarring or anxiety-inducing elements like harsh spinners. Use subtle pulsing, breathing animations that feel warm and engaging. Make wait times feel shorter and more pleasant.

**Reassurance over perfection**: Remind users they can adjust things later. Don't make every decision feel high-stakes. Help users feel confident they can experiment and refine as they go.
