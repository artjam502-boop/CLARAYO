# CLARAYO

A full-stack multi-vendor marketplace built with React, Express, and MongoDB. Customers can browse and order products, approved sellers can manage their own catalog and fulfillment, and administrators can oversee the marketplace.

## Quick start

1. Install MongoDB locally or provide a MongoDB Atlas connection string.
2. Copy `backend/.env.example` to `backend/.env` and change `JWT_SECRET` and the admin credentials.
3. Optionally copy `frontend/.env.example` to `frontend/.env`.
4. Install dependencies: `npm install`, then `npm run install:all`.
5. Create the initial admin securely: `npm run admin`.
6. Start both applications: `npm run dev`.

Frontend: `http://localhost:5173` · API: `http://localhost:5000/api`

The application starts with an empty marketplace so products, stores, categories, sellers, and orders come from real user and administrator workflows. The optional `npm run seed` command is intended only for isolated demonstrations. Use `npm run clean:sample` to remove those known demonstration records without deleting user-created data.

## Architecture

The React client uses Context for authentication and cart state, Axios for API calls, role guards for protected routes, Framer Motion for lightweight interaction, and Recharts for dashboards. The Express API separates models, routes, middleware, configuration, and scripts. MongoDB is the source of truth for users, stores, products, categories, orders, and reviews.

Orders preserve product name and price snapshots. Checkout recalculates every price on the server and uses a MongoDB transaction with conditional stock updates. Seller-facing queries are scoped by the authenticated seller ID. A multi-seller order stores an independent fulfillment status for each seller.

## Main API

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/me`
- Products: `GET /api/products`, `GET /api/products/:id`, authenticated seller/admin CRUD
- Categories: public reads and admin CRUD under `/api/categories`
- Customer orders: `POST /api/orders`, `GET /api/orders/my-orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/cancel`
- Seller: application and store endpoints under `/api/sellers`; dashboard, products, orders, and reports under `/api/seller`
- Admin: dashboard, users, seller approvals, products, orders, and reports under `/api/admin`

Every response uses `{ success, data?, message?, pagination? }`. Protected endpoints require `Authorization: Bearer <token>`.

## Verification checklist

- Register a customer, log in, browse/filter products, add mixed products to the cart, and place a COD order.
- Confirm duplicate checkout requests with the same `Idempotency-Key` return the original order.
- Attempt an order above available stock and confirm HTTP 409 with no partial stock change.
- Cancel a processing order and confirm stock is restored.
- Submit a seller application, approve it as admin, log in again, and confirm seller routes become available.
- As seller A, attempt to update seller B's product and confirm no record is exposed.
- Suspend a user and confirm authentication is rejected.

MongoDB transactions require a replica set (MongoDB Atlas provides this by default). For local development, run MongoDB as a single-node replica set if checkout transaction support is required.
