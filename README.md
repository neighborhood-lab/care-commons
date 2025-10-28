# Care Commons

> Shared care software, community owned.

**Care Commons** is a modular, self-hostable software platform designed to support the administration and daily operations of home-based care services. Built by the people at **Neighborhood Lab**.

## Vision

A human-scale alternative to enterprise care management systems. Care Commons emphasizes:

- 🏡 **Human-scale workflows** - Not enterprise excess
- 🔒 **Local autonomy** - Runs offline and on-premises if needed
- 🔌 **Interoperability by design** - APIs, import/export, open schema
- 🛡️ **Privacy and consent first** - Least-privilege access across roles
- 📦 **Incremental adoption** - Start with one vertical, add others later

## Architecture

Care Commons is structured as a set of independently deployable **verticals** that share a common core:

- Unified domain model shared across verticals
- Event-driven data flows for visit lifecycle
- Fine-grained permissions and perspective-based UI
- Durable offline data capture with conflict resolution
- Extensible APIs that allow community-developed modules
- Encryption for sensitive health and payroll-related data
- Automated validation, audit trails, and revision history

## Technology Stack

- **Backend**: TypeScript/Node.js with Express
- **Database**: PostgreSQL with JSONB for flexible data models
- **Monorepo**: Turborepo for efficient builds
- **Validation**: Zod for runtime type safety
- **Testing**: Jest

## Project Structure

```
care-commons/
├── packages/
│   └── core/              # Shared core functionality
│       ├── src/
│       │   ├── types/     # Base types and interfaces
│       │   ├── db/        # Database connection and repository
│       │   ├── permissions/  # Permission service
│       │   └── audit/     # Audit logging
│       └── migrations/    # Database migrations
│
└── verticals/             # Feature verticals
    ├── client-demographics/   ✅ Implemented
    ├── caregiver-staff/       ✅ Implemented
    ├── scheduling-visits/     ✅ Implemented
    └── ...
```

## Verticals

### ✅ Implemented

- **[Client & Demographics Management](./verticals/client-demographics/)** - Foundational record system for individuals receiving care
- **[Caregiver & Staff Management](./verticals/caregiver-staff/)** - Secure directory of personnel providing care services
- **[Scheduling & Visit Management](./verticals/scheduling-visits/)** - Service patterns, automated scheduling, and real-time visit tracking

### 📋 Planned
- Time Tracking & Electronic Visit Verification (EVV)
- Care Plans & Tasks Library
- Shift Matching & Assignment
- Billing & Invoicing
- Payroll Processing
- Compliance & Documentation
- Mobile App for Field Staff
- Family Portal / Client Portal
- Care Notes & Progress Reporting
- Incident & Risk Reporting
- Referral & Intake Management
- Medication Management
- Training & Certification Tracking
- Quality Assurance & Audits
- Reporting & Analytics
- Communication & Messaging
- Document Management & eSignatures
- Inventory & Supplies Tracking
- HR & Onboarding
- Mileage & Expense Tracking
- Role-Based Access Control & Security
- Data Backup & Offline Support

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/neighborhood-lab/care-commons.git
cd care-commons

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed

# Build all packages
npm run build

# Start development
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=care_commons
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

## Development

```bash
# Run all packages in development mode
npm run dev

# Build all packages
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Lint code
npm run lint
```

## Database Management

```bash
# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

## Documentation

- [Technical Plan](./care-commons-tech-plan.md) - Overall product vision and vertical descriptions
- [Client & Demographics](./verticals/client-demographics/README.md) - Client management vertical documentation
- [Caregiver & Staff Management](./verticals/caregiver-staff/README.md) - Caregiver and staff management documentation
- [Scheduling & Visit Management](./verticals/scheduling-visits/README.md) - Scheduling and visit tracking documentation
- [Core Package](./packages/core/README.md) - Core functionality documentation

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Principles

1. **Human-first design** - Tools should reduce burden, not add it
2. **Privacy by default** - Least-privilege access, explicit consent
3. **Offline-capable** - Core functionality works without connectivity
4. **Auditable** - All changes tracked for compliance and debugging
5. **Modular** - Verticals are independent but share common infrastructure
6. **Open** - APIs and data schemas are documented and accessible

## License

See [LICENSE](./LICENSE) for details.

## Community

- **GitHub**: [neighborhood-lab/care-commons](https://github.com/neighborhood-lab/care-commons)
- **Issues**: [Report bugs or request features](https://github.com/neighborhood-lab/care-commons/issues)

---

**Care Commons** is brought to you by [Neighborhood Lab](https://neighborhoodlab.org) 🏡

Shared care software, community owned.

[Product website](https://neighborhood-lab.github.io/care-commons-home/)  
[Organization website](https://neighborhood-lab.github.io/home/)
