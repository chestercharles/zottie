# api agents.md

## Development

1. Run `wrangler dev` to start a local instance of the API running at `http://localhost:8787/`

## Project structure

1. The router is defined in `src/index.ts`.
2. Each endpoint has its own file in `src/endpoints/`.

## Verify changes

1. Run `pnpm run tsc` to verify typescript types
2. Run `pnpm run test` to run the tests. Our e2e tests will require the server to be running.

## Automated testing

We like using e2e tests against out API interface to verify application changes because they give us the highest confidence that the features we build behave like we expect them.

We also like unit tests, but only when they can be used to verify the changes of something that won't require a lot of test mocks.
