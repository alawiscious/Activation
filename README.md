# Pharma Visual Pivot

A modern React application for managing pharmaceutical brands, contacts, and revenue data with advanced filtering, visualization, and data management capabilities.

## Features

### Core Functionality
- **Multi-Company Support**: Manage multiple pharmaceutical companies with separate data sets
- **CSV Data Import**: Import brands, contacts, and revenue data from CSV files
- **Advanced Filtering**: Multi-select filters with debounced search for efficient data exploration
- **Revenue Visualization**: Interactive charts showing worldwide and US sales trends
- **Contact Management**: Virtualized table for handling large contact datasets (1k-10k+ rows)
- **Data Persistence**: IndexedDB storage with automatic migration from localStorage

### Data Management
- **Brand Management**: Track pharmaceutical brands with status, phase, and therapeutic area
- **Contact Database**: Manage contacts with detailed information and known/unknown status
- **Revenue Tracking**: Support for both column-per-year and row-per-year revenue formats
- **Export/Import**: Full state export/import functionality

### Technical Features
- **Virtualization**: TanStack Table with react-virtual for smooth performance with large datasets
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Testing**: Vitest + React Testing Library for unit and component tests
- **Modern Build**: Vite for fast development and optimized production builds

## Tech Stack

- **Framework**: React 18 with TypeScript
- **State Management**: Zustand
- **UI Components**: shadcn/ui with Tailwind CSS
- **Charts**: Recharts
- **Tables**: TanStack Table with virtualization
- **CSV Parsing**: PapaParse
- **Storage**: IndexedDB (with localStorage fallback)
- **Testing**: Vitest + React Testing Library
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pharma-visual-pivot
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## CSV Import Formats

### Brands CSV
```csv
brand,status,phase,therapeutic_area,revenue_2026,revenue_2027,revenue_2028,revenue_2029,revenue_2030,revenue_2031,revenue_2032
Sample Brand,Active,Approved,Oncology,1000000,1200000,1500000,1800000,2000000,2200000,2500000
```

### Contacts CSV
```csv
first_name,last_name,email,title,level,functional_area,brand,therapeutic_area,known
John,Doe,john.doe@example.com,Marketing Director,Director,Marketing,Sample Brand,Oncology,true
```

### Revenue CSV (Row-per-year format)
```csv
product,brand,therapeutic_area,year,ww_sales,us_sales
Sample Product,Sample Brand,Oncology,2026,1000000,400000
```

## Data Model

### Brand
- `id`: Unique identifier
- `name`: Brand name
- `status`: Active, In Pipeline, or Discontinued
- `phase`: Preclinical, Phase I, Phase II, Phase III, Approved, or Unknown
- `therapeuticArea`: Therapeutic area classification
- `servicingAgency`: Assigned servicing agency
- `competitor`: Competitor information

### Contact
- `id`: Unique identifier
- `firstName`, `lastName`: Contact name
- `email`: Email address
- `title`: Job title
- `level`: C-Suite, VP, Director, Manager, or Individual Contributor
- `functionalArea`: Functional area (Marketing, Sales, etc.)
- `brand`: Associated brand (optional)
- `therapeuticArea`: Associated therapeutic area (optional)
- `known`: Boolean indicating if contact is known

### Revenue Row
- `id`: Unique identifier
- `brandId`: Reference to brand
- `year`: Revenue year
- `wwSales`: Worldwide sales amount
- `usSales`: US sales amount

## Architecture

### Folder Structure
```
src/
├── app/                    # App routing (if using Next.js)
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── Filters/           # Filter components
│   ├── Brands/            # Brand-related components
│   └── Contacts/          # Contact-related components
├── data/                  # Data layer
│   ├── storage/           # Storage adapters
│   ├── transformers.ts    # CSV transformation logic
│   ├── selectors.ts       # Memoized selectors
│   └── store.ts           # Zustand store
├── types/                 # TypeScript type definitions
│   └── domain.ts          # Domain types
└── test/                  # Test utilities
```

### Key Components

- **PharmaVisualPivot**: Main application component
- **FilterBar**: Advanced filtering interface with multi-select
- **BrandCard**: Brand display with revenue charts
- **ContactsTable**: Virtualized contact table
- **BrandRevenueChart**: Interactive revenue visualization

### State Management

The application uses Zustand for state management with:
- Company state management
- Filter state
- Data import/export
- Auto-save functionality

### Storage Layer

Pluggable storage architecture:
- **IndexedDbAdapter**: Primary storage for browser environments
- **InMemoryAdapter**: Fallback for SSR/Node environments
- **SupabaseAdapter**: Stubbed for future cloud storage

## Performance Optimizations

- **Virtualization**: TanStack Table with react-virtual for large datasets
- **Memoization**: Reselect for efficient selector computations
- **Debounced Search**: 300ms debounce for title search
- **Lazy Loading**: Dynamic imports for large dependencies
- **Code Splitting**: Automatic code splitting with Vite

## Testing

The application includes comprehensive tests:
- Unit tests for transformers and selectors
- Component tests for UI components
- Integration tests for data flow

Run tests with:
```bash
npm run test
```

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy

### Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

### Environment Variables
For future Supabase integration:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.








# Deployment fix Mon Sep 29 20:49:47 EDT 2025
# Environment variables configured Mon Sep 29 21:12:21 EDT 2025
# Data loading test Mon Sep 29 21:32:32 EDT 2025
# Trigger deployment
