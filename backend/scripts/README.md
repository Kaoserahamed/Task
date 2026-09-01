# Backend Scripts

## Seed Demo Data

### Create Demo Accounts
```bash
node scripts/seedDemoAccounts.js
```
Creates demo accounts for:
- User: `user@demo.com` / `demo123`
- Admin: `admin@demo.com` / `demo123`
- Company: `company@demo.com` / `demo123`

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
