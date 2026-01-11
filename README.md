<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql" alt="MySQL"/>
  <img src="https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=json-web-tokens" alt="JWT"/>
</p>

<h1 align="center">🚀 FLOW — Project & Client Management Platform</h1>

<p align="center">
  <strong>A comprehensive, enterprise-grade solution for managing projects, teams, and clients in one unified platform.</strong>
</p>

<p align="center">
  <em>What sets Flow apart: Seamlessly manage both your internal projects AND your external clients simultaneously, delivering real-time transparency and actionable deliverables to all stakeholders.</em>
</p>

---

## 🎯 The Problem We Solve

Most project management tools focus solely on internal team coordination, leaving client communication and deliverable management as an afterthought. **Flow** bridges this gap by providing:

- **Dual Management Paradigm**: Manage internal projects and external clients within a single, unified ecosystem
- **Client-Facing Portal**: Give clients real-time visibility into their project progress, documents, and deliverables without overwhelming them with internal details
- **Deliverable-Centric Approach**: Track and deliver tangible outputs to clients, not just internal task completion
- **Role-Based Transparency**: Show each stakeholder exactly what they need to see — nothing more, nothing less

---

## ✨ Key Features That Stand Out

### 🏢 Multi-Organization Architecture
Unlike simple project tools, Flow supports **multi-tenant organization management**. Perfect for agencies, consulting firms, or enterprises managing multiple client organizations.

### 👥 Advanced Role-Based Access Control (RBAC)
A sophisticated 5-tier permission system ensuring data security and appropriate access:

| Role | Scope | Capabilities |
|------|-------|--------------|
| **SUPER_ADMIN** | Platform-wide | Full system control, organization management, user administration |
| **ORG_ADMIN** | Organization | Manage organization members, projects, and settings |
| **PROJECT_MANAGER** | Projects | Full project control, team assignment, task management |
| **TEAM_MEMBER** | Assigned Tasks | Task updates, comments, calendar, meeting requests |
| **CLIENT** | Deliverables | View project progress, access documents, provide feedback |

### 📊 Real-Time Dashboard & Analytics
Dynamic dashboards tailored to each role, providing:
- Project progress tracking with visual indicators
- Task completion rates and burndown insights
- Team workload distribution
- Client project overviews

### 📁 Project Document Management
- **Drag-and-drop file uploads** for project documentation
- Version tracking and file history
- Client-accessible document sharing
- Secure file storage and retrieval

### 🔔 Intelligent Notification System
Real-time notifications keep all stakeholders informed:
- Task assignments and status changes
- Meeting requests and approvals
- Client feedback alerts
- Deadline reminders

### 📅 Integrated Calendar & Meeting Management
- Personal calendar view for team members
- Meeting request system between team members and project managers
- Schedule visibility across projects

### 🌓 Modern UI/UX
- **Dark/Light mode** for comfortable viewing
- Responsive design for desktop and mobile
- Intuitive navigation with clean aesthetics
- Shadcn/UI components for consistency

---

## 🏗️ Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TypeScript)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │    Pages     │  │   Services   │  │   Contexts   │  │  Components │  │
│  │   (Routes)   │  │    (API)     │  │   (State)    │  │    (UI)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │ REST API (HTTP/JSON)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Spring Boot 3)                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      REST Controllers                               │ │
│  │  Auth │ User │ Organization │ Project │ Task │ Notification │ ...  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                  │                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       Service Layer                                 │ │
│  │     Business Logic │ Validation │ Security │ Notifications          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                  │                                       │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Repository Layer (JPA)                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   ▼
                        ┌──────────────────────┐
                        │       MySQL          │
                        │     Database         │
                        └──────────────────────┘
```

### Data Model

```
Organization (1) ──────▶ (N) Project (1) ──────▶ (N) Task
      │                        │                      │
      │                        │                      │
      ▼                        ▼                      ▼
OrganizationMember       ProjectMember          TaskComment
      │                        │                      │
      └────────────────────────┴──────────────────────┘
                               │
                               ▼
                             User ◀────── NotificationEvent
                               │
                               ▼
                      Meeting │ ProjectDocument
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | Component-based UI library |
| TypeScript | Type-safe JavaScript |
| Vite | Fast build tool and dev server |
| Tailwind CSS | Utility-first styling |
| Shadcn/UI | Pre-built accessible components |
| React Query | Server state management |
| React Router | Client-side routing |
| React Hook Form + Zod | Form handling and validation |
| Recharts | Data visualization |

### Backend
| Technology | Purpose |
|------------|---------|
| Spring Boot 3 | Java application framework |
| Java 17 | Programming language |
| Spring Security | Authentication & authorization |
| JWT | Stateless token-based auth |
| Spring Data JPA | Database abstraction |
| Hibernate | ORM for data persistence |
| MySQL | Relational database |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Java** (JDK 17 or higher)
- **MySQL** (v8.0 or higher)
- **Maven** (v3.8 or higher)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/flow-project-management.git
   cd flow-project-management
   ```

2. **Configure the database**
   
   Create a MySQL database and update `Flow-backend/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/flow_db
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   spring.jpa.hibernate.ddl-auto=update
   ```

3. **Run the backend**
   ```bash
   cd Flow-backend
   ./mvnw spring-boot:run
   ```
   The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd Flow-frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

---

## 📡 API Endpoints Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User authentication |
| POST | `/api/auth/logout` | Session termination |

### Organizations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations` | List all organizations |
| POST | `/api/organizations` | Create new organization |
| PUT | `/api/organizations/{id}` | Update organization |
| DELETE | `/api/organizations/{id}` | Deactivate organization |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List accessible projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/{id}` | Get project details |
| POST | `/api/projects/{id}/members` | Add project member |
| POST | `/api/projects/{id}/documents` | Upload document |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List user's tasks |
| POST | `/api/tasks` | Create new task |
| PATCH | `/api/tasks/{id}/status` | Update task status |
| POST | `/api/tasks/{id}/comments` | Add comment |

---

## 🔒 Security Features

- **JWT-based authentication** with secure token management
- **Method-level authorization** using `@PreAuthorize` annotations
- **Data-level access control** ensuring users only see permitted resources
- **CORS configuration** for secure cross-origin requests
- **Input validation** using Bean Validation and Zod schemas
- **Password encryption** with BCrypt

---

## 🎨 Screenshots

*Coming soon: Dashboard, Project Management, Client Portal, and Task Board views*

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**Ahmed Messoudi** - *Initial work and development*

---

<p align="center">
  <strong>Built with ❤️ for seamless project and client management</strong>
</p>

<p align="center">
  <a href="#-flow--project--client-management-platform">Back to top ↑</a>
</p>
