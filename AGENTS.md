# zottie agents.md

zottie is an application that helps a household coordinate grocery lists, manage their kitchen inventory and efficiently meal prep.

## Stack

zottie is a Expo mobile application with a cloudflare worker as a backend API. We use Auth0 for user authentication. We use cloudflare D1 for data storage, and use Drizzle to interface with it.

## Coding style

Avoid adding code comments. If you truly think an implementation detail is likely to be very confusing for future developers, it is OK to leave a comment explaining why the implementation detail exists.

Keep implementations simple and focused.
