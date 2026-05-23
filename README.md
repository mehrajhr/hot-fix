# 🚼 HotFix – Internal Tech Issue & Feature Tracker

HotFix is a collaborative, internal workspace application engineered for software development teams to report infrastructure bugs, log feature requests, and coordinate pipeline updates. Powered by a rigorous Role-Based Access Control (RBAC) security matrix, it streamlines tech workflow transparency across administrative lines.

🌐 **Production Deployment Live Link:** https://hot-fix-lovat.vercel.app/

---

## 🚀 Architectural & System Features

- **Strict Identity Constraints (RBAC):** Middleware checks handle user access. Contributors manage their own workflow lifecycle, while Maintainers keep total global authority.
- **Advanced Dynamic Multi-Query Aggregations:** Evaluates query filters (`type`, `status`) and temporal configurations (`newest`, `oldest`) without processing high-overhead multi-row JOIN statements.
- **Military-Grade Data Safety:** Features cryptographic salt routines (between 8 and 12 rounds) using `bcrypt` and signed verification tokens using stateless `jsonwebtoken` models.
- **Fail-Safe Pipeline Catching:** Employs an Express routing handler that safely intercepts both runtime synchronous exceptions and asynchronous Promise rejections under a single umbrella.

---

## 🛠️ Production Technology Stack

| Technology | Implementation Specification |
| :--- | :--- |
| **Node.js (v24.x LTS)** | Core runtime layer powering Vercel Serverless environments |
| **TypeScript (Latest)** | Strict static code typing and type-safe schema modeling |
| **Express.js** | Decoupled modular controller-service routing framework |
| **PostgreSQL** | High-performance relational database engine |
| **Node-pg Client (`pg`)** | Low-level pooling client executing explicit raw SQL syntax |
| **jsonwebtoken (JWT)** | Signed payload tokenization for stateless request authorization |
| **bcrypt** | Secure cryptographic key derivation for user password hashing |

---

## 🗄️ Normalized Database Schema Summary

The relational database layer isolates data tracking arrays into two clean structures, leaving referential integrity checking to application layer services.

### 1. `users` Data Definition Profile

CREATE TABLE IF NOT EXISTS users (

    id SERIAL PRIMARY KEY,
    
    name VARCHAR(30) NOT NULL,
    
    email VARCHAR(35) UNIQUE NOT NULL ,
    
    password TEXT NOT NULL,
    
    role VARCHAR(15) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    updated_at TIMESTAMP DEFAULT NOW()
    
);

### 2. `issues` Data Definition Profile

CREATE TABLE IF NOT EXISTS issues(

       id SERIAL PRIMARY KEY,
       
       title VARCHAR(150) NOT NULL ,
       
       description TEXT NOT NULL CHECK (char_length(description) >= 20),
       
       type VARCHAR(17) NOT NULL CHECK (type IN ('bug' , 'feature_request')),
       
       status VARCHAR(15) DEFAULT 'open' CHECK (status IN ('open' , 'in_progress' , 'resolved')),
       
       reporter_id INT NOT NULL,
       
       created_at TIMESTAMP DEFAULT NOW(),
       
       updated_at TIMESTAMP DEFAULT NOW()
       
);

---

## 🌐 Explicit API Endpoints Specification

### 🔹 Authentication Management
#### `POST /api/auth/signup`
- **Access Context:** Public Shared Entrypoint
- **Payload Shape:**
  {
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "password": "securePassword123",
    "role": "contributor" or "maintainer"
  }
- **Success Sequence (201 Created):** Parses input, strips passwords out of active stack loops, and issues clean metadata responses.

#### `POST /api/auth/login`
- **Access Context:** Public Shared Entrypoint
- **Payload Shape:**
  {
    "email": "john.doe@devpulse.com",
    "password": "securePassword123"
  }
- **Success Sequence (200 OK):** Generates signed access context headers packed with `id`, `name`, and operational system `role`.

---

### 🔹 Issues Pipeline Management
#### `POST /api/issues`
- **Access Context:** Authenticated Operator Space (`contributor`, `maintainer`)
- **Headers Required:** `Authorization: <JWT_TOKEN>`
- **Payload Shape:**
  {
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug"
  }

#### `GET /api/issues`
- **Access Context:** Public Read Access
- **Supported Query Filters:** `?sort=newest|oldest&type=bug|feature_request&status=open|in_progress|resolved`
- **Process Routine:** Fetches targets dynamically, then uses an asynchronous array map query loop to attach reporter objects without building heavy relational SQL joins.

#### `GET /api/issues/:id`
- **Access Context:** Public Read Access
- **Return Value:** Individual target issue with matching profile reporter object metadata mapped underneath.

#### `PATCH /api/issues/:id`
- **Access Context:** Conditional Authorization Gate
- **Protected Rule Matrix:** Execution is granted exclusively to global `maintainer` profiles, OR local resource owner `contributor` accounts *only* if the issue `status` is currently marked as `open`.

#### `DELETE /api/issues/:id`
- **Access Context:** Administrative Level Gate (`maintainer` only)
- **Result (200 OK):** Permanently removes the target issue tracking array from the workspace database pool.

---

## ⚙️ Local Machine Initialization Sequence

Follow these manual configuration routines to deploy the service locally:

### 1. Replicate Project Base
git clone (clone url)

cd hot-fix

### 2. Sync Runtime Dependencies
npm install

### 3. Establish Local Environment Profiles

Initialize a `.env` deployment profile at the project root folder layout:

PORT=5000 or 3000 or your choice

CONNECTION_STRING= your postgresql with neon connection string

JWT_SECRET=production_level_cryptographic_secret_string_key

JWT_EXPIRES_IN=1d or your choice

### 4. Execute Native Compilation Pipeline
# Execute local code watch environments
npm run dev

# Run absolute production build sequences
npm run build

# Boot compiled runtime output targets
npm start
