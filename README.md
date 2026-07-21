# TypeScript + Express Backend Boilerplate (JWKS Authentication)

A lightweight, clean, and secure backend boilerplate designed for speed of development, strong type safety, and core security standards.

## Core Stack

- **Runtime & Web Framework**: Node.js & Express
- **Language**: TypeScript (v5.5+)
- **Security & Authentication**:
  - `jose`: Modern and native JSON Web Token signature verification library
  - `helmet`: Safe security headers
  - `cors`: Configuration for cross-origin request policies
  - `express-rate-limit`: Protect routes from brute-force/DoS attacks
- **Dev Tools**:
  - `nodemon` & `ts-node` for live development reloading
  - `eslint` (flat config) & `prettier` for linting and code styling

---

## Directory Structure

```text
├── src/
│   ├── app.ts             # Express setup, security filters, verifyToken middleware, health endpoint, error handler
│   └── server.ts          # Env load & validate, app bootstrap & process handlers
├── .env                    # Local environment variable overrides (git ignored)
├── .env.example            # Template environment config file
├── eslint.config.js        # ESLint flat configuration
├── package.json            # NPM manifest (scripts and dependencies)
├── tsconfig.json           # TypeScript compiler rules
└── README.md               # Project documentation
```

---

## Environment Variables

Copy the template file to configure variables:
```bash
cp .env.example .env
```

| Key | Description | Default |
|---|---|---|
| `PORT` | Listening port for the HTTP server | `3000` |
| `NODE_ENV` | Mode of operation (`development` \| `production` \| `test`) | `development` |
| `BASE_URL` | Frontend/BetterAuth server base host (used to load JWKS) | `http://localhost:5173` |

---

## JWKS Authentication Middleware

The boilerplate includes a `verifyToken` middleware in [src/app.ts](file:///d:/boilerplate%20backend/src/app.ts#L29-L48) that verifies remote JWT tokens issued by BetterAuth:
- **Keyset endpoint**: Dynamic fetch of JSON Web Key Sets from `${BASE_URL}/api/auth/jwks`.
- **Verified Payload**: Attached to `res.locals.user` for use in downstream routes.

### Usage Example:
```typescript
import app, { verifyToken } from "./app";

app.post("/api/v1/secure-route", verifyToken, (req, res) => {
  const userPayload = res.locals.user;
  res.json({ message: "Access granted", user: userPayload });
});
```

---

## Available Scripts

In the project root, run:

### Development Mode (Hot Reload)
```bash
npm run dev
```

### Build (Compile TypeScript to JS)
```bash
npm run build
```

### Production Mode (Start Built App)
```bash
npm run start
```

### Code Linting
```bash
npm run lint
```

### Auto-Format Code
```bash
npm run format
```

---

## API Endpoints

### 🩺 Health Checks
* **`GET /`** -> Redirects to the health check route.
* **`GET /api/v1/health`** -> Returns diagnostic JSON containing server uptime, memory usage, and execution environment mode.
# boilerplateBackend
