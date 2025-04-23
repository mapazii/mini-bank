
### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```
# Database connection
DATABASE_URL="mysql://user:password@localhost:3306/minibank"

# JWT secrets
JWT_ACCESS_SECRET="your-access-token"
JWT_REFRESH_SECRET="your-refresh-token"

# Port
PORT=3000
```


### 3. Set up the database

Create the database schema and tables:

```bash
npx prisma migrate dev --name init
```

Seed the database with initial admin user:

```bash
npm run prisma:seed
```

### 5. Start the application

Development mode:

```bash
npm run dev
```

The application will be running at http://localhost:3000 (or the port you specified in the .env file).

## API Endpoints

### Authentication
- `POST /login` - Admin login
- `POST /token/refresh` - Refresh access token
- `POST /logout` - Logout

### Customer Management
- `GET /customers` - Get all customers (with pagination)
- `POST /customers` - Create a new customer
- `GET /customers/:id` - Get customer details
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer (soft delete)

### Transactions
- `POST /customers/:id/deposit` - Make a deposit
- `POST /customers/:id/withdraw` - Make a withdrawal

### Reports
- `GET /customers/:id/balance` - Get customer balance
- `GET /customers/:id/transactions` - Get customer transactions (with filters)

### Dashboard
- `GET /dashboard/summary` - Get dashboard summary data

## Admin Login Credentials

- Email: daffa@bank.com
- Password: password

## Testing the API

Import the provided Postman collection to test all API endpoints.
