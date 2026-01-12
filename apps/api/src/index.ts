import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { authMiddleware, type AuthVariables } from './middleware/auth'
import { HouseholdGetEndpoint } from './endpoints/householdGet'
import { HouseholdUpdateEndpoint } from './endpoints/householdUpdate'
import { HouseholdInviteCreateEndpoint } from './endpoints/householdInviteCreate'
import { HouseholdInviteGetEndpoint } from './endpoints/householdInviteGet'
import { HouseholdJoinEndpoint } from './endpoints/householdJoin'
import { PantryItemCreateEndpoint } from './endpoints/pantryItemCreate'
import { PantryItemDeleteEndpoint } from './endpoints/pantryItemDelete'
import { PantryItemListEndpoint } from './endpoints/pantryItemList'
import { PantryItemUpdateEndpoint } from './endpoints/pantryItemUpdate'

// Start a Hono app
const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// Apply auth middleware to all /api routes
app.use('/api/*', authMiddleware())

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/',
})

// Household endpoints
openapi.get('/api/household', HouseholdGetEndpoint)
openapi.patch('/api/household', HouseholdUpdateEndpoint)
openapi.post('/api/household/invite', HouseholdInviteCreateEndpoint)
openapi.get('/api/household/invite/:code', HouseholdInviteGetEndpoint)
openapi.post('/api/household/join/:code', HouseholdJoinEndpoint)

// Pantry endpoints
openapi.get('/api/pantry-items', PantryItemListEndpoint)
openapi.post('/api/pantry-items', PantryItemCreateEndpoint)
openapi.patch('/api/pantry-items/:id', PantryItemUpdateEndpoint)
openapi.delete('/api/pantry-items/:id', PantryItemDeleteEndpoint)

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app
