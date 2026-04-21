# Local Link

Local Link is a full-stack local marketplace app that connects customers with nearby vendors. Customers can browse vendors, search and filter listings, add products to a cart, place orders, chat with vendors inside the app, and call vendors directly. Vendors can manage products, review incoming requests and orders, and reply to customer chats from their dashboard.

## Features

- Customer and vendor authentication
- Hero-style landing page with navbar and autoplay video
- Customer vendor discovery with working search and category filtering
- Vendor profile pages with product listings
- Cart-based ordering with quantity support
- Service requests between customers and vendors
- Vendor accept, decline, cancel, and delete request flow
- In-app customer/vendor chat
- Direct vendor calling via saved phone number
- Vendor product create, edit, and delete flow
- Customer and vendor profile editing

## Tech Stack

- Frontend: React, React Router, Vite
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT

## Project Structure

```text
LocalLink-Main-main/
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ utils/
│  │  ├─ app.js
│  │  └─ server.js
│  ├─ package.json
│  └─ .env.example
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ services/
│  │  └─ main.jsx
│  ├─ package.json
│  └─ .env.example
├─ LOCALINK_MVP_DOC.md
└─ README.md
```

## Setup

### 1. Install dependencies

From the project root:

```powershell
npm install
```

### 2. Configure environment variables

Backend: create `backend/.env`

```env
PORT=4000
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/localink?retryWrites=true&w=majority
JWT_SECRET=replace_me_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
```

Frontend: create `frontend/.env`

```env
VITE_API_URL=http://localhost:4000/api
```

## Run the App

Start the backend:

```powershell
cd backend
npm start
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm run dev
```

App URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- API health check: `http://localhost:4000/api/health`

## Important Note About the Database

The backend now expects a real `MONGODB_URI`, which is intended for MongoDB Atlas in deployment. If `MONGODB_URI` is missing or invalid, the backend will fail fast instead of silently using a temporary in-memory database.

## User Flows

### Customer

- Sign up or log in
- Browse nearby vendors
- Use the top search bar and category dropdown to filter vendors
- Open a vendor page
- Add products to cart with quantities
- Send the cart as an order
- Send a service request
- Chat with the vendor inside the app
- Call the vendor directly
- Track request and order status

### Vendor

- Sign up or log in as a vendor
- Add phone, category, and location during signup
- Open the vendor dashboard
- View incoming service requests and orders
- Accept, decline, or delete pending requests
- Reply to customer chats
- Add, edit, and delete products

## Main Backend Routes

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me`

### Vendors and products

- `GET /api/vendors`
- `GET /api/vendor/:id`
- `GET /api/products/:vendorId`
- `POST /api/product`
- `PATCH /api/product/:id`
- `DELETE /api/product/:id`

### Requests and orders

- `GET /api/requests`
- `POST /api/request`
- `PUT /api/request/:id`
- `PATCH /api/request/:id`
- `DELETE /api/request/:id`

### Chat

- `GET /api/chats`
- `GET /api/chat/:otherUserId`
- `POST /api/chat/:otherUserId/messages`

## Frontend Pages

- `/auth` - landing page plus login/signup
- `/vendors` - customer home and vendor discovery
- `/vendor/:id` - vendor profile, cart, in-app chat, call option
- `/vendor/dashboard` - vendor requests, chat inbox, and product management

## Scripts

### Root workspace

```powershell
npm run build
npm run dev:frontend
npm run dev:backend
```

### Frontend

```powershell
npm run dev
npm run build
npm run preview
```

### Backend

```powershell
npm start
npm run dev
```

## Vercel Deployment

This repo is set up for a single Vercel project:

- The React app builds from `frontend/dist`
- The Express backend is exposed through `api/[[...route]].js`
- Client requests use `/api/...` in production

Set these Vercel environment variables:

- `MONGODB_URI` = your MongoDB Atlas connection string
- `JWT_SECRET` = a long random secret
- `CLIENT_ORIGIN` = your deployed frontend URL, for example `https://your-project.vercel.app`

For local development, keep `frontend/.env` pointing at `http://localhost:4000/api`.

## Current Status

This repo already includes:

- Responsive landing page
- Working frontend and backend integration
- Built-in in-app chat
- Quantity-based cart ordering
- Role-based vendor/customer flows

## Documentation

There is an additional project note file here:

- [LOCALINK_MVP_DOC.md](./LOCALINK_MVP_DOC.md)

## License

No license has been added yet.
