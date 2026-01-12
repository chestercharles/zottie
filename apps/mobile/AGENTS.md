# mobile agents.md

We like to colocate cohesive code. Instead of organization things in to folders by type (eg. /components, /hooks, /queries), we like to organization things by feature (eg. /onboarding, /profile, /grocery-list, /grocery-item).

Ideally, we could colocate most of the code associated with a screen next to the router file. However, Expo requires that every file in the /app directory is a route. So we can just import the screen from our feature module. All the routes in the /app folder should be very sparse. Our feature modules will probably closely match our routes.

## Automated testing

We generally don't write any automated UI test for Expo Go apps because they tend to be brittle. We don't have any e2e testing set up for our expo app. You can generally assume that we'll manually test out features that have to be verified through the UI.

If there is self-contained logic that can easily be unit tested without mocks, we highly encourage unit testing.

## Verify changes

1. Run `pnpm run lint` to lint the codebase
2. Run `pnpm run tsc` to check typescript types
3. Run `pnpm run test` to run the tests
