# Naija Delights Frontend

Built by **Group 82** (TS Academy Capstone).

React (Vite) + React Router + Tailwind CSS + Axios. Talks to the Express API in `../backend`.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
```
In development Vite proxies `/api` to `http://localhost:5001` (see `vite.config.js`). If your backend uses another port, change it there. The backend must be running.

## Environment
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Leave empty locally. In production set to the deployed API, e.g. `https://your-api.onrender.com/api` |

## Pages
- Public: Home, About, Login, Register, Menu (search, region, price, sort, pagination), Dish details, Track order (by code, no login)
- Customer (login required): Cart, Checkout (state/LGA + delivery fee), My orders (filter + pagination), Order details (status tracker, payment, cancel)
- Admin (admin role): Dashboard, Menu (add/edit/delete dishes), Categories (regions), Orders (filter, search, update status)

Loading spinners show on every API call, and errors are shown as readable messages (never raw Axios errors).

## Deploy (Vercel)
1. Import the repo, set the root directory to `frontend`.
2. Add `VITE_API_URL` pointing at the deployed backend `/api`.
3. In the backend env, set `CLIENT_URL` to the Vercel URL so CORS allows it.
