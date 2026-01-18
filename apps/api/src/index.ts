import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { authMiddleware, type AuthVariables } from './middleware/auth'
import { HouseholdCreateEndpoint } from './endpoints/householdCreate'
import { HouseholdGetEndpoint } from './endpoints/householdGet'
import { HouseholdMembershipGetEndpoint } from './endpoints/householdMembershipGet'
import { HouseholdUpdateEndpoint } from './endpoints/householdUpdate'
import { HouseholdInviteCreateEndpoint } from './endpoints/householdInviteCreate'
import { HouseholdInviteGetEndpoint } from './endpoints/householdInviteGet'
import { HouseholdJoinEndpoint } from './endpoints/householdJoin'
import { HouseholdLeaveEndpoint } from './endpoints/householdLeave'
import { PantryItemCreateEndpoint } from './endpoints/pantryItemCreate'
import { PantryItemDeleteEndpoint } from './endpoints/pantryItemDelete'
import { PantryItemListEndpoint } from './endpoints/pantryItemList'
import { PantryItemUpdateEndpoint } from './endpoints/pantryItemUpdate'
import { CommandParseEndpoint } from './endpoints/commandParse'
import { CommandExecuteEndpoint } from './endpoints/commandExecute'
import { AssistantChatEndpoint } from './endpoints/assistantChat'

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
openapi.post('/api/household', HouseholdCreateEndpoint)
openapi.get('/api/household/membership', HouseholdMembershipGetEndpoint)
openapi.patch('/api/household', HouseholdUpdateEndpoint)
openapi.post('/api/household/invite', HouseholdInviteCreateEndpoint)
openapi.get('/api/household/invite/:code', HouseholdInviteGetEndpoint)
openapi.post('/api/household/join/:code', HouseholdJoinEndpoint)
openapi.post('/api/household/leave', HouseholdLeaveEndpoint)

// Pantry endpoints
openapi.get('/api/pantry-items', PantryItemListEndpoint)
openapi.post('/api/pantry-items', PantryItemCreateEndpoint)
openapi.patch('/api/pantry-items/:id', PantryItemUpdateEndpoint)
openapi.delete('/api/pantry-items/:id', PantryItemDeleteEndpoint)

// Command endpoints
openapi.post('/api/commands/parse', CommandParseEndpoint)
openapi.post('/api/commands/execute', CommandExecuteEndpoint)

// Assistant endpoints
openapi.post('/api/assistant/chat', AssistantChatEndpoint)

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app
