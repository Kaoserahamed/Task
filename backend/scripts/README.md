# Backend Scripts

## Seed Demo Data

### Create Demo Accounts

```bash
node scripts/seedDemoAccounts.js
```

Requires `DEMO_USER_PASSWORD`, `DEMO_ADMIN_PASSWORD`, and `DEMO_COMPANY_PASSWORD`
in `backend/.env` (see `backend/.env.example`). Creates demo accounts for:

- User: `user@demo.com` (password from `DEMO_USER_PASSWORD`)
- Admin: `admin@demo.com` (password from `DEMO_ADMIN_PASSWORD`)
- Company: `company@demo.com` (password from `DEMO_COMPANY_PASSWORD`)

### Create Sample Tour Packages

```bash
node scripts/seedTourPackages.js
```

Creates 5 sample tour packages with complete details.

**OR** use the API endpoint (easier):

```
GET http://localhost:4000/api/seed-tours
```

This creates:

1. Cox's Bazar Beach Tour
2. Sundarbans Adventure
3. Sajek Valley Trek
4. Historical Dhaka Tour
5. Sylhet Tea Garden Tour
