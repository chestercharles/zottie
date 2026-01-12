import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { PantryItemCreateEndpoint } from './endpoints/pantryItemCreate'
import { PantryItemListEndpoint } from './endpoints/pantryItemList'

// Start a Hono app
const app = new Hono<{ Bindings: Env }>()

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/',
})

// Pantry endpoints
openapi.get('/api/pantry-items', PantryItemListEndpoint)
openapi.post('/api/pantry-items', PantryItemCreateEndpoint)

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app
