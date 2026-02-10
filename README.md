# Schindler - Oracle Forms Migration Architect

Schindler is a specialized tool designed to assist in the migration of legacy Oracle Forms applications to a modern architecture (React + NestJS). It analyzes Oracle Forms XML exports (`.xml` from `.fmb`) to identify migration patterns, calculate complexity, and suggest modern equivalents.

## 🏗 Architecture

The project follows a **Monorepo** structure:

-   **Frontend**: Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. It provides an interactive dashboard to upload files, view analysis results, and manage configuration.
-   **Backend**: Built with **NestJS**, **TypeORM**, and **TypeScript**. It handles XML parsing, complexity analysis (identifying heavy PL/SQL, synchronous UI calls, and Record Groups), and data persistence.
-   **Database**: **PostgreSQL** used to store analysis results and configurations.
-   **Infrastructure**: Fully **Dockerized** using `docker-compose` for easy orchestration of frontend, backend, and database services.

## 📂 Project Structure

```
/
├── backend/            # NestJS API Application
│   ├── src/
│   │   ├── analysis/   # Core logic for XML parsing & complexity scoring
│   │   └── ...
├── frontend/           # React Source
│   ├── src/
│   │   ├── components/ # UI Components
│   │   └── App.tsx     # Main Logic & Dashboard
├── examples/           # Sample Oracle Forms XML files
├── docs/               # Technical documentation
└── docker-compose.yml  # Container orchestration
```

## 🚀 Getting Started

### Prerequisites

-   **Docker** and **Docker Compose** installed on your machine.

### Installation & Run

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd schindler
    ```

2.  **Start the application**:
    ```bash
    docker-compose up --build
    ```

3.  **Access the application**:
    -   **Frontend**: [http://localhost:5173](http://localhost:5173)
    -   **Backend API**: [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Backend Unit Tests

The backend includes a suite of unit tests, specifically focusing on the `AnalysisService` to ensure accurate XML parsing and pattern detection.

To run tests locally:

```bash
cd backend
npm install
npm test
```

**Coverage**:
-   The core `AnalysisService` is fully covered, validating:
    -   Record Group extraction.
    -   Complexity scoring (Triggers/Program Units).
    -   Identification of "Heavy Business Logic" (Candidates for Stored Procedures).
-   *Note: Frontend currently does not have a test suite configured.*

## 🛠 Tech Stack

-   **Runtime**: Node.js
-   **Languages**: TypeScript
-   **Frameworks**: NestJS, React, Vite
-   **Styling**: Tailwind CSS, Lucide React (Icons)
-   **Database**: PostgreSQL
-   **Tools**: fast-xml-parser, Docker
