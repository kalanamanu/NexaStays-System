# Hotel Reservation System

A modern, responsive hotel reservation and management system built with Next.js, React, Tailwind CSS, and Shadcn UI.

## Features

### Multi-Role Support
- **Customer**: Make reservations, view bookings, manage profile
- **Clerk**: Handle check-ins/check-outs, manage reservations
- **Manager**: View reports, analytics, and performance metrics
- **Travel Company**: Create block bookings with special rates

### Key Functionality
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Theme switching with next-themes
- **Role-Based Navigation**: Dynamic navigation based on user role
- **Reservation Management**: Complete booking workflow
- **Real-time Analytics**: Occupancy and revenue reporting
- **Block Bookings**: Bulk reservations for travel companies
- **Accessibility**: WCAG 2.1 compliant components

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **Theme**: next-themes
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone or download the project files**

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   \`\`\`

3. **Install Shadcn UI components** (if not already included)
   \`\`\`bash
   npx shadcn@latest init
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
├── app/
│   ├── dashboard/
│   │   ├── customer/          # Customer dashboard
│   │   ├── clerk/             # Clerk dashboard  
│   │   └── manager/           # Manager dashboard
│   ├── reservation/           # Reservation form
│   ├── travel-portal/         # Travel company portal
│   ├── login/                 # Authentication
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # Shadcn UI components
│   ├── nav-bar.tsx            # Navigation component
│   └── theme-provider.tsx     # Theme provider
├── context/
│   └── user-context.tsx       # User authentication context
└── lib/
    └── utils.ts               # Utility functions
\`\`\`

## Usage

### Authentication
- Use any email/password combination to log in
- Select the appropriate role during login
- The system will redirect to the role-specific dashboard

### Customer Features
- Make new reservations
- View and manage existing bookings
- Cancel reservations
- Search and filter bookings

### Clerk Features
- Check-in guests and assign rooms
- Process check-outs with billing
- Manage all reservations
- Generate receipts

### Manager Features
- View occupancy reports and analytics
- Monitor revenue across different sources
- Export reports (PDF/CSV)
- Track performance metrics

### Travel Company Features
- Create block bookings (minimum 3 rooms)
- Apply negotiated discount rates
- Manage group reservations
- View booking history

## Customization

### Styling
- Modify `tailwind.config.ts` for custom colors and themes
- Update `app/globals.css` for global styles
- Customize Shadcn UI components in `components/ui/`

### Adding New Features
- Create new pages in the `app/` directory
- Add components to `components/`
- Extend the user context for additional roles
- Update navigation in `nav-bar.tsx`

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings

### Other Platforms
1. Build the project: `npm run build`
2. Start the production server: `npm start`
3. Deploy the `.next` folder to your hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support and questions:
- Check the documentation
- Review the code comments
- Create an issue on GitHub

---

Built with ❤️ using Next.js and Shadcn UI
