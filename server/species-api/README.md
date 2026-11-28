# Plant species API

The species API is separate from the existing sensor simulator. It uses Node's built-in SQLite support and creates/initializes `species.db` from `schema.sql` on first start, including 30 seed species.

## Run

Use Node.js 22.13 or newer. From the repository root:

```powershell
node server/species-api/server.js
```

The API listens on port `3001` by default. Set `PORT` to use another port. The SQLite database is stored beside the server; set `PLANT_SPECIES_DB` to change its location.

## Endpoints

- `GET /api/species?q=basil&category=Herbs&page=1&pageSize=10` — search, filter, and paginate
- `GET /api/species/:id` — species details
- `GET /api/species/lookup/:code` — look up a plant code such as `PLANT-001`
- `GET /api/species/:id/thresholds` — care thresholds for automation and alerts

Valid categories are `Succulents`, `Herbs`, `Indoor`, and `Tropical`. `pageSize` can be 1–50.

For a physical phone using Expo Go, set `EXPO_PUBLIC_SPECIES_API_URL` in `sproutflow/.env` to the computer's LAN address, for example `http://192.168.1.25:3001/api`. Android emulators can use `http://10.0.2.2:3001/api`; web and iOS simulators can use the default `http://localhost:3001/api`. Restart Expo after changing `.env`.
