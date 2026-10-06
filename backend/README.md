# Naija Delights — Backend API

Built by **Group 82** (TS Academy Capstone). Food ordering and delivery API. Node.js + Express + MongoDB (Mongoose). Part of the TS Academy capstone MVP.

**Features:** register/login (JWT, bcrypt), customer/admin roles, regions (categories) and dishes (CRUD, search, filter, pagination), cart, checkout with Nigerian state/LGA delivery and a delivery fee, atomic portion reservation, simulated payments, public order tracking by code, admin order management and stats.

## Setup

```bash
npm install
cp .env.example .env      # then fill in values
npm run seed              # menu (Yoruba, Igbo, Hausa dishes) and an admin account
npm run seed -- --reset   # same, and also clears orders, payments and carts
npm run dev               # http://localhost:5000
npm test                  # Jest + Supertest (uses an in-memory MongoDB)
```

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Allowed frontend origin(s), comma separated |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin created by `npm run seed` |

`.env` is git-ignored. Never commit it.

## Structure

```
src/
├── config/        db connection, env check
├── data/          locations.json (37 states, 759 LGAs)
├── controllers/   request handlers
├── middleware/    auth, validation, error handling
├── models/        User, Category, Product, Cart, Order, Payment
├── routes/        route definitions
├── services/      business logic (auth, cart, orders, payments)
├── utils/         AppError, asyncHandler, apiResponse, pagination, delivery (fee + location check)
├── validators/    Zod schemas
├── app.js
└── server.js
```

## Response format

Success: `{ "success": true, "message": "Product created successfully", "data": { ... } }`
Error: `{ "success": false, "message": "Product not found", "data": null }`
Validation errors also include `"errors": [{ "field": "price", "message": "Price must be greater than 0" }]`.

Auth: send `Authorization: Bearer <token>`. Status codes: 400 validation, 401 not logged in, 403 not allowed, 404 not found, 409 conflict.

Paginated lists return `data: { items: [...], pagination: { total, page, limit, totalPages } }`.

## Endpoints

Auth column: **Public**, **User** (any logged in), **Admin**.

### Auth
| Method | Endpoint | Purpose | Auth | Body |
|---|---|---|---|---|
| POST | `/api/auth/register` | Create customer account | Public | `name`, `email`, `password` (8+ chars, letter + number), `phone?` |
| POST | `/api/auth/login` | Log in | Public | `email`, `password` |
| GET | `/api/auth/me` | Current user | User | — |
| PATCH | `/api/auth/me` | Update profile | User | `name?`, `phone?`, `address?{street,city,state}` |

Success (register/login, 201/200): `data: { user, token }`
Errors: 400 invalid input, 401 `Invalid email or password`, 409 `An account with this email already exists`.

### Categories
| Method | Endpoint | Purpose | Auth | Body |
|---|---|---|---|---|
| GET | `/api/categories` | List categories | Public | — |
| POST | `/api/categories` | Create | Admin | `name`, `description?` |
| PATCH | `/api/categories/:id` | Update | Admin | `name?`, `description?` |
| DELETE | `/api/categories/:id` | Delete (blocked if it has products) | Admin | — |

### Products
| Method | Endpoint | Purpose | Auth | Body / Params |
|---|---|---|---|---|
| GET | `/api/products` | List dishes with search, filter, pagination | Public | Query: `search`, `category`, `minPrice`, `maxPrice`, `sort` (`newest`, `price_asc`, `price_desc`, `name`), `page`, `limit` |
| GET | `/api/products/:id` | Product details | Public | `:id` |
| POST | `/api/products` | Create | Admin | `name`, `price` (> 0), `stock` (portions available, int ≥ 0), `category` (region id), `description?`, `icon?` (emoji), `imageUrl?`, `isActive?` |
| PATCH | `/api/products/:id` | Update | Admin | any of the create fields |
| DELETE | `/api/products/:id` | Delete | Admin | `:id` |

Example: `GET /api/products?search=phone&category=<id>&page=1&limit=10`
Errors: 400 invalid id/body, 403 not admin, 404 `Product not found`.

### Cart
| Method | Endpoint | Purpose | Auth | Body / Params |
|---|---|---|---|---|
| GET | `/api/cart` | View cart with totals | User | — |
| POST | `/api/cart/items` | Add item | User | `productId`, `quantity` (default 1) |
| PATCH | `/api/cart/items/:productId` | Set quantity | User | `quantity` |
| DELETE | `/api/cart/items/:productId` | Remove item | User | — |
| DELETE | `/api/cart` | Empty cart | User | — |

Success: `data: { items: [{ product, quantity, subtotal }], totalItems, totalAmount }`
Errors: 400 `Only 3 unit(s) of "X" available`, 404 `Product not found` / `Item not found in cart`.

### Locations
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/locations` | Delivery states with their LGAs, and the delivery fee rule | Public |

Success: `data: { states: { "Lagos": ["Agege", ...], ... }, fees: { "Lagos": 1500, "default": 3500 } }`

### Orders
| Method | Endpoint | Purpose | Auth | Body / Params |
|---|---|---|---|---|
| POST | `/api/orders` | Place order from cart | User | `shippingAddress{fullName, phone, street, state, lga}` (`lga` must belong to `state`) |
| GET | `/api/orders` | My orders | User | Query: `status`, `search`, `from`, `to`, `page`, `limit` |
| GET | `/api/orders/:id` | Order details (own, or any for admin) | User | `:id` |
| PATCH | `/api/orders/:id/cancel` | Cancel own order (pending or confirmed) | User | `:id` |
| GET | `/api/orders/track/:code` | Track an order by its tracking code (the order number, e.g. `ND-1A2B3C4D5E`) | **Public** | `:code` |
| GET | `/api/orders/admin/all` | All orders | Admin | same query as above |
| GET | `/api/orders/admin/stats` | Totals and revenue | Admin | — |
| PATCH | `/api/orders/:id/status` | Update status | Admin | `status`: `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled` |

Pricing: `subtotal` (sum of dishes) + `deliveryFee` (₦1,500 for Lagos, ₦3,500 elsewhere) = `totalAmount`.
Status flow: `pending → confirmed → preparing → out_for_delivery → delivered`. A successful payment confirms a pending order automatically; the kitchen can also confirm manually (for pay on delivery). `cancelled` is allowed up to `preparing` and returns the portions.
Public tracking returns status, items, totals, destination (LGA and state) and status history only. Name, phone and street are never exposed.
Errors: 400 `Your cart is empty`, 400 `Not enough portions of "X" (only N left)`, 400 `Cannot change order from "pending" to "preparing"`, 404 `Order not found`, 404 `No order was found with that tracking code`.

### Payments (simulated gateway)
| Method | Endpoint | Purpose | Auth | Body |
|---|---|---|---|---|
| POST | `/api/payments/initiate` | Create a pending payment for an order | User | `orderId`, `method?` (`card`, `bank_transfer`, `pay_on_delivery`) |
| POST | `/api/payments/confirm` | Settle the payment (stands in for a gateway callback) | User | `reference`, `outcome` (`success` / `failed`) |
| GET | `/api/payments` | My payments | User | — |

Success (confirm): `data: { payment, order }`; the order moves to `confirmed` and `paymentStatus` to `paid`. A failed payment can be retried by initiating again.
Errors: 400 `This order has already been paid`, 404 `Order not found` / `Payment not found`.

## Security notes
Passwords hashed with bcrypt; JWT-protected routes; role checks on admin routes; roles cannot be set at registration; all input validated server-side (Zod); passwords never returned; Helmet, CORS allow-list and auth rate limiting; secrets in environment variables.
