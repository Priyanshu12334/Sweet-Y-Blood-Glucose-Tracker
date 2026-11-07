<<<<<<< HEAD
# Sweet-Y – Blood Glucose Tracker

A full-stack, secure, and responsive web application designed for tracking, monitoring, and analyzing daily blood glucose readings. Sweet-Y provides individuals managing diabetes or tracking their metabolic health with an intuitive interface to log glucose levels, visualize trends over time, evaluate meal-time patterns, and maintain complete control over their personal health data.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Architecture](#database-architecture)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Project Overview

Sweet-Y is built with a decoupled architecture featuring a **React (Vite)** single-page application frontend and a **Node.js (Express)** RESTful API backend backed by **PostgreSQL** via **Prisma ORM**.

Authentication is handled securely using **JSON Web Tokens (JWT)** stored in `HttpOnly`, `SameSite` cookies, ensuring sensitive tokens cannot be accessed via client-side JavaScript. Readings are strictly isolated per user, and database-level constraints prevent duplicate entries for the same user, date, and meal slot.

---

## Key Features

- **User Authentication**:
  - Secure registration, login, and logout.
  - Password hashing using `bcrypt` (10 salt rounds).
  - Cookie-based authentication using `HttpOnly` JWTs.
  - Instant session restoration via `/api/auth/me`.

- **Personalized Health Dashboard**:
  - Welcome greeting personalized with the user's name.
  - Daily metric summary cards: **Today's Highest**, **Today's Lowest**, **Today's Average**, and **Total Readings Today**.
  - Quick-view log of recent glucose readings.
  - Custom scrollbar styling preventing distracting horizontal overflow.

- **Glucose Readings Management (CRUD)**:
  - Add glucose readings with numeric value (mg/dL), calendar date, time picker, meal slot, and optional notes (up to 500 characters).
  - Supported meal slots: *Before Breakfast*, *After Breakfast*, *Before Lunch*, *After Lunch*, *Before Dinner*, *After Dinner*, *Bedtime*, and *Morning*.
  - Strict backend validation: values restricted to positive whole numbers between 1 and 600 mg/dL; future dates rejected.
  - Enforced daily constraint: maximum of one reading per meal slot per date per user (`@@unique([userId, date, slot])`).
  - Delete individual readings with immediate UI updates.

- **Reports & Analytics**:
  - Preset filters: **Last 7 Days**, **Last 30 Days**, **Last 3 Months**, and **Custom Date Range** (with future date protection).
  - Dynamic summary cards calculated strictly over the active date range.
  - **Interactive Glucose Trend Chart**: Responsive SVG line chart displaying readings chronologically, reference target zone (70–140 mg/dL), and interactive tooltips showing slot, timestamp, and notes.
  - **Meal-wise Analysis**: Aggregated glucose averages and counts broken down by meal slot (only displaying slots with recorded data).
  - Detailed reading history table for the selected timeframe.

- **Responsive & Modern Design**:
  - Custom brand aesthetics with soft medical green (`#5d997b`), white cards, and subtle gray tones.
  - Custom SVG favicon featuring a bold letter **S** with brand accent styling.
  - Fully responsive sidebar navigation and layout for desktop, tablet, and mobile browsers.

---

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios (configured with `withCredentials: true`)
- **Styling**: Modern vanilla CSS with responsive flex/grid layouts and Google Font (`DM Sans`)
- **Visualizations**: Custom interactive SVG charts with responsive `viewBox` scaling

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL 16 (running via Docker)
- **ORM**: Prisma ORM 6 (`@prisma/client`)
- **Authentication**: `jsonwebtoken` (JWT), `bcrypt`
- **Configuration**: `dotenv`

### DevOps & Containerization
- **Database Container**: Docker & Docker Compose (`postgres:16-alpine`)
- **Process Management**: Nodemon for local development reload

---

## Project Structure

```
Sweet-y/
├── docker-compose.yml              # PostgreSQL 16 service definition
├── .env.example                    # Sample environment variables template
├── .gitignore                      # Git ignore rules for node_modules, logs, and env
├── package.json                    # Root/backend dependencies & scripts
├── package-lock.json
│
├── server/                         # Express API backend
│   ├── config/
│   │   └── db.js                   # Prisma Client singleton instance
│   ├── controllers/
│   │   ├── authController.js       # Register, login, logout, me logic
│   │   ├── readingController.js    # Glucose readings CRUD & validation
│   │   └── reportController.js     # Daily, range, and monthly report analytics
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT cookie verification & user attachment
│   ├── routes/
│   │   ├── auth.js                 # /api/auth routes
│   │   ├── readingRoutes.js        # /api/readings routes
│   │   └── reportRoutes.js         # /api/reports routes
│   ├── utils/
│   │   └── dateOnly.js             # UTC date-only normalization utilities
│   ├── validators/
│   │   ├── authValidator.js        # Registration & login payload validation
│   │   └── readingValidator.js     # Glucose, slot, date, and note rules
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma 6 models, constraints, and indexes
│   │   └── migrations/             # PostgreSQL migration history
│   ├── app.js                      # Express app configuration & middleware
│   ├── server.js                   # Server entry point listening on PORT
│   └── package.json
│
└── client/                         # Vite + React frontend
    ├── index.html                  # HTML entry point with custom SVG favicon
    ├── vite.config.js              # Vite configuration
    ├── package.json                # Frontend dependencies & scripts
    ├── public/
    │   └── favicon.svg             # Custom Sweet-Y brand green "S" favicon
    └── src/
        ├── main.jsx                # React root mount
        ├── App.jsx                 # Application routes & provider wrappers
        ├── index.css               # Global typography, layout shell & theme CSS
        ├── services/
        │   └── api.js              # Axios instance (baseURL: http://localhost:5000/api)
        ├── context/
        │   └── AuthContext.jsx     # User authentication state & methods
        ├── routes/
        │   └── ProtectedRoute.jsx  # Route guard redirecting guests to /login
        ├── components/
        │   ├── common/
        │   │   ├── Button.jsx      # Reusable styled button component
        │   │   └── Card.jsx        # Rounded elevation card component
        │   ├── layout/
        │   │   ├── Header.jsx      # Topbar with branding and user avatar
        │   │   └── Sidebar.jsx     # Navigation sidebar with active page indicators
        │   └── reports/
        │       └── GlucoseTrendChart.jsx # Interactive SVG line chart & tooltips
        └── pages/
            ├── Login.jsx           # Sign-in form
            ├── Register.jsx        # User registration form
            ├── Dashboard.jsx       # Health overview & daily metrics
            ├── Dashboard.css       # Dashboard layout & scrollbar rules
            ├── Readings.jsx        # Full readings log & add-reading modal form
            ├── Reports.jsx         # Analytics, date filters, trend chart & meal breakdown
            └── Reports.css         # Reports & chart styling
```

---

## Database Architecture

The PostgreSQL database is managed via **Prisma ORM** with the following schema:

```prisma
model User {
  id        String    @id @default(uuid())
  name      String
  email     String    @unique
  password  String
  createdAt DateTime  @default(now())
  readings  Reading[]
}

model Reading {
  id           String   @id @default(uuid())
  userId       String
  date         DateTime @db.Date
  time         String   // HH:mm (24-hour format)
  slot         String   // Meal slot identifier
  glucoseValue Int      // mg/dL value
  notes        String?  @db.VarChar(500)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, date, slot])
  @@index([userId, date])
}
```

### Key Schema Design Decisions:
1. **UUID Primary Keys**: Prevents enumeration attacks across users and readings.
2. **`@db.Date` Mapping**: Anchors calendar dates to UTC midnight, eliminating time-zone shifts when filtering daily entries.
3. **Compound Unique Constraint**: `@@unique([userId, date, slot])` strictly guarantees that a user cannot submit duplicate entries for the same slot on the same day.
4. **Performance Indexing**: `@@index([userId, date])` optimizes range queries and date-sorted lookups.

---

## Environment Variables

Copy the provided `.env.example` file to `.env` in the project root:

```bash
cp .env.example .env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `POSTGRES_USER` | PostgreSQL superuser username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password | `postgres` |
| `POSTGRES_DB` | PostgreSQL database name | `sweety_db` |
| `DATABASE_URL` | Prisma PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/sweety_db?schema=public` |
| `JWT_SECRET` | Secret key used to sign and verify auth tokens | `your_secure_jwt_secret_key` |
| `CLIENT_URL` | Frontend origin permitted by CORS credentials | `http://localhost:3000` |
| `PORT` | Backend server port (optional) | `5000` |

> **Security Note:** Never commit your actual `.env` file containing production secrets to version control.

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [Docker](https://www.docker.com/) & Docker Compose (for running PostgreSQL)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Priyanshu12334/Sweet-Y-Blood-Glucose-Tracker
cd Sweet-Y-Blood-Glucose-Tracker
```

### Step 2: Install Dependencies
Install dependencies for both the backend root and the client:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 3: Configure Environment Variables
Create your local environment file:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` and `JWT_SECRET` are properly set.

### Step 4: Start the PostgreSQL Database with Docker
Launch the PostgreSQL 16 container:
```bash
docker compose up -d
```
Verify the container is healthy:
```bash
docker compose ps
```

### Step 5: Run Prisma Migrations & Generate Client
Apply database migrations to create tables and generate the Prisma Client:
```bash
npm run migrate
npm run generate
```

---

## Running the Application

### 1. Start the Backend API
From the root project directory:
```bash
# Development mode with auto-reload
npm run dev

# Or start in standard production mode
npm start
```
The API server will listen on `http://localhost:5000`.

### 2. Start the Frontend Application
In a separate terminal window, start the Vite development server:
```bash
cd client
npm run dev
```
The client application will be available at `http://localhost:3000` (or `http://localhost:5173`).

---

## API Documentation

All API endpoints are prefixed with `/api`. Protected routes require a valid `token` cookie.

### Authentication Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`name`, `email`, `password`). Sets `HttpOnly` token cookie. |
| `POST` | `/api/auth/login` | Public | Sign in with `email` and `password`. Sets `HttpOnly` token cookie. |
| `POST` | `/api/auth/logout` | Protected | Clears the `token` authentication cookie. |
| `GET` | `/api/auth/me` | Protected | Returns current authenticated user profile (`id`, `name`, `email`, `createdAt`). |

### Readings Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/readings` | Protected | Add a new reading (`date`, `time`, `slot`, `glucoseValue`, optional `notes`). |
| `GET` | `/api/readings` | Protected | Fetch all readings for the authenticated user (sorted by date/time descending). |
| `GET` | `/api/readings/:id` | Protected | Fetch a single reading by its UUID. |
| `PUT` | `/api/readings/:id` | Protected | Update an existing reading owned by the authenticated user. |
| `DELETE` | `/api/readings/:id` | Protected | Delete a reading owned by the authenticated user. |

### Reports & Analytics Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Protected | Returns aggregated summary (`average`, `highest`, `lowest`, `totalReadings`), meal-wise analysis, and chronological readings for the date range. |
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Protected | Daily summary statistics and individual readings for a specific calendar date. |
| `GET` | `/api/reports/month-to-date?date=YYYY-MM-DD` | Protected | Aggregated summary from the 1st of the month through the selected date. |
| `GET` | `/api/reports/monthly?month=MM&year=YYYY` | Protected | Full-month aggregated summary statistics. |

---


## Future Improvements

- **Data Export**: Export reading history and summary reports to CSV and PDF formats for physician review.
- **Estimated HbA1c**: Calculate an estimated HbA1c percentage based on 90-day average blood glucose readings.
- **Medication & Insulin Logging**: Support supplementary tracking for oral medications and fast/long-acting insulin doses.
- **Reminders & Push Notifications**: Configurable alerts reminding users to test glucose levels after designated meal times.
- **Dark Mode**: Accessible dark-mode theme option tailored for evening and nighttime logging.

---

## License

This project is licensed under the [MIT License](LICENSE).
=======
# Sweet-Y-Blood-Glucose-Tracker
A full-stack blood glucose tracking application built with React, Node.js, Express, PostgreSQL, and Prisma. Features secure JWT authentication, glucose reading management, personalized dashboards, and analytics with interactive reports.
>>>>>>> 8891b7f4b3e13ff905c4d91abe6c183160f98e6f
