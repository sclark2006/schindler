# Schindler - Oracle Forms Migration Architect

Schindler is a comprehensive platform designed to accelerate and govern the migration of legacy Oracle Forms applications to modern architectures (React + NestJS). It goes beyond simple code conversion by providing deep analysis, architectural visualization, and governance tools.

## 🌟 Key Features

### 1. Project-Centric Management
-   **Multi-Project Support**: Organize migration efforts by project or business unit.
-   **Dashboard**: Centralized view of all analyzed modules, their complexity, and migration status.

### 2. Deep Static Analysis
Schindler parses Oracle Forms XML exports (`.xml`) to extract:
-   **Blocks & Hierarchies**: Visualizes the structure of Canvas, Windows, and Blocks.
-   **PL/SQL Logic**: Identifies Triggers and Program Units, classifying them by complexity.
-   **Data Structures**: Extracts Record Groups to identify potential API endpoints.
-   **Complexity Scoring**: Calculates complexity based on LOC, dependency depth, and UI coupling.

### 3. Architecture Visualization
-   **C4 Diagrams**: Automatically generates logical architecture diagrams (Context, Container, Component) from the Forms metadata.
-   **Interactive Graphs**: Explore relationships between blocks and database tables.

### 4. Governance & Scoping
-   **Service Registry**: Define and track backend services (APIs) required for migration.
-   **Ticket Integration**: (In Progress) Integration with Azure DevOps/GitHub to create tasks directly from analysis findings.
-   **Scoping**: Mark specific Program Units or Record Groups as candidates for microservices/endpoints.

---

## 🏗 Architecture

The platform follows a modern **Monorepo** structure:

### Frontend
-   **Framework**: React 18 (Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS + Lucide Icons
-   **State**: Context API
-   **Visualization**: React Flow (Architecture Diagrams)

### Backend
-   **Framework**: NestJS
-   **Language**: TypeScript
-   **Database ORM**: TypeORM
-   **Analysis Engine**: Custom XML parsing logic (fast-xml-parser)
-   **API**: RESTful endpoints secured with JWT

### Infrastructure
-   **Database**: PostgreSQL 15
-   **Orchestration**: Docker Compose (Full stack containerization)

---

## 🚀 Getting Started

### Prerequisites
-   **Docker** and **Docker Compose** installed.

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
    -   **Frontend**: [http://localhost:5173](http://localhost:5173) (Login: `admin` / `password`)
    -   **Backend API**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Development

### Running Tests
The backend includes a suite of unit tests for the analysis engine.

```bash
cd backend
npm install
npm test
```

### Folder Structure
```
/
├── backend/            # NestJS API & Analysis Engine
├── frontend/           # React Dashboard & Visualization
├── examples/           # Sample Oracle Forms XML files
└── docker-compose.yml  # Container orchestration
```

---

## 🔮 Roadmap & Future Features

### 🛠 Improvements
- [x] **Navigation**: Link the application title ("Schindler") to the selected project's dashboard.
- [x] **Localization**: Standardize all application labels to English for global consistency.

### 🚀 Planned Features

#### 🧠 Generative AI Integration (Project-Scoped)
- **Flexible Models**: Configure Local LLMs (Ollama) or Cloud Providers (OpenAI/Azure) per project.
- **Contextual Analysis**: Analyze Data Blocks, Record Groups, or PL/SQL units to generate migration recommendations.
- **Automated Outputs**: Suggest NestJS service structures, DTOs, and ticket descriptions automatically.
- **Form Purpose Summary**: Auto-generate a high-level explanation of the module's business goal (e.g., "Manages Inventory Logistics") using AI analysis of its components.

#### 🏗 Architecture & Visualization 2.0
- **Advanced Diagramming**: Significant enhancements to C4 diagrams with interactive filtering and data-flow tracing.
- **Dependency Mapping**: Visual graph of dependencies between Forms, Libraries (.pll), and Database Objects.
- **Layered View**: Distinct visualization of UI, Business Logic, and Data Persistence layers.

#### 🔌 ALM & SCM Integrations
- **Platform Agnostic**: Support for Azure DevOps, GitHub, and Jira.
- **Project-Level Configuration**: Enforce a single, specific integration platform per project to match team workflows.
- **Plugin Architecture**: Modular design to easily add new integration providers as plugins.

#### 📋 Advanced Ticketing & Governance
- **Smart Templates**: Admin-defined Markdown/HTML templates for ticket creation, customizable per project.
- **Pre-Submission Review**: Specific UI to edit ticket payloads (title, description, tags) before creation.
- **Traceability**: Persistent links between Oracle Forms elements (Blocks/Triggers) and external tickets.
- **Status Sync**: View real-time ticket status directly within the Schindler dashboard.

#### 🌐 Ecosystem Integration (MCP)
- **Service Discovery**: Integrate with Model Context Protocol (MCP) servers to query existing API catalogs (e.g., ORDS, Mulesoft).
- **Anti-Duplication**: Proactively warn users if a similar service already exists before proposing a new one.

---

## 🤝 Contributing
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Open a Pull Request.

---
*Developed by Deepmind Agent*
