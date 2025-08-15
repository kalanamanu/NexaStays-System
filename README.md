# Nexa Stays Hotel Reservation and Management System

A modern, full-stack web application for managing hotel reservations, rooms, customer profiles, billing, analytics, and payments.  
Built with **Next.js (React)** on the frontend, **Express.js** (Node.js) on the backend, **Prisma ORM** with **PostgreSQL** for the database, and **Stripe** for secure online payments.

---

# Nexa Stays Hotel Reservation and Management System – Features

Below are the key features and requirements implemented in the Nexa Stays Hotel Reservation and Management System:

---

## 1. Customer Reservations
- Customers can make, change, or cancel reservations via the web interface.
- Reservation clerks can also create reservations on behalf of customers, capturing personal details, room type, occupants, and stay dates.

## 2. Reservation Guarantee and Automatic Cancellation
- Reservations can be made with or without credit card details.
- Reservations **without credit card details are automatically cancelled at 7 PM daily** if not confirmed.

## 3. No-Show Handling and Reporting
- Customers who do not show up ("no-shows") are charged for their reservation.
- **Billing records are automatically created for no-shows by 7 PM daily.**
- A daily report is generated to show total occupancy and revenue for the previous night.

## 4. Check-In and Check-Out Management
- Reservation clerks can:
  - Check in customers (with or without prior reservation).
  - Change the checkout date.
  - Check out customers.
- Room assignment occurs at check-in, and a customer record is created.

## 5. Billing and Payments
- At checkout, customers may pay via cash or credit card.
- A billing record is created for every checkout, and customers receive a detailed statement.
- Late checkouts are automatically charged for an additional night.
- Optional charges supported: restaurant, room service, laundry, telephone, club facility.

## 6. Manager Reports and Analytics
- Managers can view various reports, including:
  - Current and historical hotel occupancy.
  - Projected future occupancy.
  - Financial and revenue reports by date or period.

## 7. Travel Company Block Bookings
- Travel companies can reserve ("block book") 3 or more rooms at discounted rates for one or more nights.
- Block bookings are billed directly to the travel company.

## 8. Residential Suite Reservations
- Customers may reserve residential suites (in addition to hotel rooms), occupying them for a week or a month at a time.
- Billing supports weekly or monthly rates for suites.

---

This feature set ensures comprehensive management of hotel operations, from reservations and billing to reporting and analytics, supporting both individual guests and travel companies.

---

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Radix UI, Stripe Elements
- **Backend:** Express.js, Node.js, Prisma ORM, Stripe API, PostgreSQL
- **Utilities:** date-fns, bcrypt, JWT, cron jobs, various UI and charting libraries

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nexa-stays.git
cd nexa-stays
```

### 2. Setup Environment Variables

- Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories.
- Fill in your database URL, Stripe keys, and other secrets as required.

### 3. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

### 4. Setup the Database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Run the Application

#### Backend

```bash
npm start
# Or for dev mode
npm run dev
```

#### Frontend

```bash
cd ../frontend
npm run dev
```

- The frontend will typically run on [http://localhost:3000](http://localhost:3000)
- The backend API will typically run on [http://localhost:5000](http://localhost:5000)

---

## Key Project Structure

```
backend/
  ├── app.js                # Main Express server entry
  ├── prisma/schema.prisma  # Database schema
  ├── routes/               # API endpoints
  ├── cron/                 # Scheduled background tasks
  └── ...
frontend/
  ├── components/           # React components
  ├── pages/                # Next.js pages/routes
  ├── styles/               # Tailwind and other styles
  └── ...
```

---

## API Overview

- RESTful endpoints for authentication, reservations, rooms, customer profiles, block bookings, analytics, and payment webhooks.
- See `backend/routes/` and API docs for details.

---

## Payment Integration

- Stripe is used for secure credit card payments.
- Payment status is automatically updated via Stripe webhooks.
- Example usage in frontend:
  ![ReservationPaymentForm Example](image1)

---

## Database Models Overview

- **User, CustomerProfile, TravelCompanyProfile**
- **Room, Reservation, BlockBooking**
- **BillingRecord**
- See `backend/prisma/schema.prisma` for full data model.

---

## Contributing

Pull requests and issues are welcome!  
Please open an issue to discuss your ideas or report bugs.

---

## License

This project is licensed under the ISC License.

---

## Acknowledgements

- [Prisma](https://www.prisma.io/)
- [Next.js](https://nextjs.org/)
- [Stripe](https://stripe.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---
