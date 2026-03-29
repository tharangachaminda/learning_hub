# User Story: Admin/Teacher Login & Dashboard

**Story ID:** US-QG-005.5  
**Epic:** Full-Grade Question Generation & Management  
**Priority:** P0 (Critical)  
**Story Points:** 8  
**Sprint:** TBD

## User Story

```
As an admin or teacher
I want to log in to a dedicated dashboard
So that I can access the question approval workflow and manage content securely
```

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-001:** Admin/teacher can log in with email and password via a dedicated login page
- [ ] **AC-002:** Login returns a JWT containing the user's role (`admin` or `teacher`)
- [ ] **AC-003:** Unauthenticated users are redirected to the login page when accessing protected routes
- [ ] **AC-004:** After login, admin/teacher sees a dashboard with summary stats (pending, approved, rejected question counts)
- [ ] **AC-005:** Dashboard prominently displays the number of pending questions awaiting review
- [ ] **AC-006:** Dashboard provides navigation links to the question review queue (placeholder for US-QG-006)
- [ ] **AC-007:** An authenticated admin can invite new admin/teacher users via an invite-only registration endpoint
- [ ] **AC-008:** Student-role users cannot access the admin login or dashboard
- [ ] **AC-009:** A `GET /api/auth/me` endpoint returns the current user's profile and role
- [ ] **AC-010:** A default admin account is seeded on first database initialization

### Technical Requirements

- **REQ-QG-015:** Implement `JwtStrategy` using `passport-jwt` for stateless token validation
- **REQ-QG-016:** Implement `JwtAuthGuard` (global-ready) for protecting endpoints
- **REQ-QG-017:** Implement `RolesGuard` and `@Roles()` decorator for role-based access control
- **REQ-QG-018:** Add `POST /api/auth/admin/login` endpoint for admin/teacher authentication
- **REQ-QG-018a:** Add `POST /api/auth/admin/register` invite-only endpoint (requires valid admin JWT)
- **REQ-QG-018b:** Add `GET /api/auth/me` profile endpoint returning current user info from JWT
- **REQ-QG-018c:** Add `GET /api/questions/stats` endpoint returning question counts grouped by status
- **REQ-QG-018d:** Seed a default admin user (`admin@learninghub.local`) in `docker/mongodb-init/init.js`
- **REQ-QG-018e:** Generate a new `admin-app` Angular application via Nx with standalone component architecture
- **REQ-QG-018f:** Implement admin login page, auth service, auth guard, and dashboard page in `admin-app`

## Definition of Done

- [ ] Admin/teacher login endpoint working and returning JWT with role
- [ ] `JwtStrategy`, `JwtAuthGuard`, and `RolesGuard` implemented and unit tested
- [ ] `@Roles()` decorator restricts endpoints to specified roles
- [ ] Invite-only registration endpoint creates admin/teacher accounts (requires admin JWT)
- [ ] Default admin user seeded in MongoDB init script
- [ ] `admin-app` Angular app generated and configured in Nx workspace
- [ ] Admin login page authenticates and stores JWT
- [ ] Dashboard displays question counts by status (pending/approved/rejected)
- [ ] Student-role users are rejected from admin endpoints with 403
- [ ] Unit tests cover JWT strategy, guards, role decorator, login, and registration
- [ ] Integration tests verify role-based access control

## Dependencies

- US-QG-005 (MongoDB persistence with Question schema and `status` field)
- Existing `User` schema already supports `admin`, `teacher`, `parent`, `student` roles
- `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs` packages already installed

## Technical Implementation Notes

### Backend (NestJS API)

- **JWT Strategy:** Create `api/src/app/auth/strategies/jwt.strategy.ts` using `passport-jwt` `ExtractJwt.fromAuthHeaderAsBearerToken()`. Validate by looking up user from JWT `sub` claim. Wire into `AuthModule` via `PassportModule.register({ defaultStrategy: 'jwt' })`
- **Guards:** Create `api/src/app/auth/guards/jwt-auth.guard.ts` (extends `AuthGuard('jwt')`) and `api/src/app/auth/guards/roles.guard.ts` (reads `@Roles()` metadata via `Reflector`)
- **Roles decorator:** Create `api/src/app/auth/decorators/roles.decorator.ts` using `SetMetadata`
- **Admin login:** Add `POST /api/auth/admin/login` to existing `AuthController` — validates credentials and verifies role is `admin` or `teacher` (rejects students/parents)
- **Invite registration:** Add `POST /api/auth/admin/register` protected by `JwtAuthGuard` + `@Roles('admin')` — creates new user with specified role (`admin` or `teacher`)
- **Profile endpoint:** Add `GET /api/auth/me` protected by `JwtAuthGuard` — returns user profile from JWT payload
- **Question stats:** Add `GET /api/questions/stats` to `QuestionsController` — returns `{ pending: N, approved: N, rejected: N, total: N }`, protected by `JwtAuthGuard` + `@Roles('admin', 'teacher')`
- **Seed admin:** Add bcrypt-hashed password for `admin@learninghub.local` in `docker/mongodb-init/init.js`
- Reference existing student auth pattern in `api/src/app/auth/auth.service.ts` and `auth.controller.ts`

### Frontend (Admin App)

- **Generate app:** Use `nx g @nx/angular:application admin-app` with standalone component architecture (matching `student-app` pattern, not NgModule `parent-app` pattern)
- **Auth service:** `admin-app/src/app/services/auth.service.ts` — login, logout, token storage, `isAuthenticated()`, `getRole()` (reference: `student-app/src/app/services/auth.service.ts`)
- **Auth guard:** `admin-app/src/app/guards/auth.guard.ts` — functional `CanActivateFn`, redirects to `/login` (reference: `student-app/src/app/guards/auth.guard.ts`)
- **Login page:** `admin-app/src/app/features/login/` — email + password form, calls `POST /api/auth/admin/login`, stores JWT, redirects to `/dashboard`
- **Dashboard page:** `admin-app/src/app/features/dashboard/` — protected route, calls `GET /api/questions/stats`, displays question counts with visual cards, shows pending count prominently, navigation placeholder for approval workflow (US-QG-006)
- **Routes:** `/login` (public), `/dashboard` (guarded), `/` redirects to `/dashboard`
- **Proxy config:** Add `proxy.conf.json` to proxy `/api` to the NestJS backend (matching `student-app` pattern)

## Testing Scenarios

### Scenario 1: Admin Login Success

```gherkin
Given there is a seeded admin user "admin@learninghub.local"
When the admin logs in with valid credentials
Then the response should contain a JWT with role "admin"
And the admin should be redirected to the dashboard
```

### Scenario 2: Student Rejected from Admin Login

```gherkin
Given there is a student user "student@example.com"
When the student attempts to log in via POST /api/auth/admin/login
Then the login should be rejected with 403 Forbidden
And the message should indicate "Insufficient role"
```

### Scenario 3: Unauthenticated Dashboard Access

```gherkin
Given a user is not logged in
When they navigate to /dashboard in the admin-app
Then they should be redirected to /login
```

### Scenario 4: Dashboard Displays Question Stats

```gherkin
Given there are 20 pending, 50 approved, and 5 rejected questions in MongoDB
When an admin views the dashboard
Then the dashboard should display "20 Pending", "50 Approved", "5 Rejected"
And the pending count should be visually prominent
```

### Scenario 5: Invite-Only Registration

```gherkin
Given an admin is authenticated with a valid JWT
When the admin creates a new teacher account via POST /api/auth/admin/register
Then a new user with role "teacher" should be created
And the new teacher should be able to log in
```

### Scenario 6: Invite Registration Requires Admin Role

```gherkin
Given a teacher is authenticated with a valid JWT
When the teacher attempts to POST /api/auth/admin/register
Then the request should be rejected with 403 Forbidden
And only admins should be able to invite new users
```

### Scenario 7: Role Guard Blocks Unauthenticated Request

```gherkin
Given no JWT is provided in the Authorization header
When a request is made to GET /api/questions/stats
Then the response should be 401 Unauthorized
```

## Success Metrics

- Admin/teacher login completes in < 500ms
- Dashboard loads question stats in < 1 second
- Zero student-role users able to access admin endpoints
- Invite registration flow creates valid accounts on first attempt
- JWT token validation adds < 50ms overhead per request
- Default admin seed works reliably on fresh database initialization

## Status

**Ready for Implementation**
