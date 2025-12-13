# Présentation du Projet - ProjectFlow

## Plan de Présentation

---

## 1. Introduction au Projet

### 1.1 Contexte
**ProjectFlow** est une application de gestion de projets moderne et complète développée avec une architecture full-stack. L'application permet aux entreprises de gérer leurs organisations, projets, tâches et équipes de manière efficace.

### 1.2 Objectifs du Projet
- Centraliser la gestion des projets d'une organisation
- Faciliter la collaboration entre les équipes
- Automatiser les notifications et le suivi des tâches
- Fournir un système de rôles et permissions granulaire
- Offrir une interface utilisateur moderne et responsive

### 1.3 Technologies Utilisées

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | React 18 + TypeScript |
| **UI Components** | Shadcn/UI + Tailwind CSS |
| **Backend** | Spring Boot 3 (Java 17) |
| **Base de données** | MySQL |
| **Authentification** | JWT (JSON Web Tokens) |
| **ORM** | JPA / Hibernate |
| **Gestion de versions** | Git |

---

## 2. Architecture du Projet

### 2.1 Vue d'ensemble de l'Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages     │  │  Services   │  │  Contexts   │  │ Components  │        │
│  │  (Routes)   │  │  (API)      │  │  (State)    │  │  (UI)       │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Spring Boot)                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CONTROLLERS (REST API)                        │   │
│  │   Auth │ User │ Organization │ Project │ Task │ Notification │ ...  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           SERVICES                                   │   │
│  │   AuthService │ UserService │ ProjectService │ TaskService │ ...    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         REPOSITORIES (JPA)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     ▼
                        ┌─────────────────────────┐
                        │      BASE DE DONNÉES    │
                        │         MySQL           │
                        └─────────────────────────┘
```

### 2.2 Diagramme de Classes (Schéma Horizontal)

```
┌──────────────────┐     1:N     ┌──────────────────┐     1:N     ┌──────────────────┐
│   Organization   │────────────▶│     Project      │────────────▶│      Task        │
├──────────────────┤             ├──────────────────┤             ├──────────────────┤
│ - id             │             │ - id             │             │ - id             │
│ - name           │             │ - name           │             │ - title          │
│ - description    │             │ - description    │             │ - description    │
│ - isActive       │             │ - status         │             │ - status         │
│ - createdAt      │             │ - startDate      │             │ - priority       │
│ - orgAdmin ──────┼──┐          │ - endDate        │             │ - dueDate        │
└──────────────────┘  │          │ - projectManager │             │ - assignedTo ────┼──┐
                      │          │ - organization ──┼──┘          │ - createdBy      │  │
                      │          └──────────────────┘             └──────────────────┘  │
                      │                   │                                │             │
                      │                   │ 1:N                           │ 1:N         │
                      │                   ▼                               ▼             │
                      │          ┌──────────────────┐             ┌──────────────────┐ │
                      │          │  ProjectMember   │             │   TaskComment    │ │
                      │          ├──────────────────┤             ├──────────────────┤ │
                      │          │ - id             │             │ - id             │ │
                      │          │ - user ──────────┼──┐          │ - content        │ │
                      │          │ - project        │  │          │ - createdAt      │ │
                      │          │ - role           │  │          │ - user ──────────┼─┤
                      │          └──────────────────┘  │          └──────────────────┘ │
                      │                                │                                │
                      │          ┌──────────────────┐  │                                │
                      │          │ OrganizationMember│ │                                │
                      │          ├──────────────────┤  │                                │
                      │          │ - id             │  │                                │
                      │          │ - organization   │  │                                │
                      │          │ - user ──────────┼──┤                                │
                      │          └──────────────────┘  │                                │
                      │                                │                                │
                      └─────────▶┌──────────────────┐◀─┴────────────────────────────────┘
                                 │      User        │
                                 ├──────────────────┤
                                 │ - id             │
                                 │ - username       │
                                 │ - email          │
                                 │ - password       │
                                 │ - firstName      │
                                 │ - lastName       │
                                 │ - roles          │
                                 │ - isActive       │
                                 └──────────────────┘
                                          │
                                          │ 1:N
                                          ▼
                                 ┌──────────────────┐
                                 │NotificationEvent │
                                 ├──────────────────┤
                                 │ - id             │
                                 │ - type           │
                                 │ - title          │
                                 │ - message        │
                                 │ - isRead         │
                                 │ - createdAt      │
                                 └──────────────────┘
```

### 2.3 Entités Additionnelles

```
┌──────────────────┐              ┌──────────────────┐              ┌──────────────────┐
│    Meeting       │              │ ProjectDocument  │              │   SystemConfig   │
├──────────────────┤              ├──────────────────┤              ├──────────────────┤
│ - id             │              │ - id             │              │ - id             │
│ - title          │              │ - fileName       │              │ - configKey      │
│ - description    │              │ - fileType       │              │ - configValue    │
│ - scheduledAt    │              │ - fileData       │              └──────────────────┘
│ - requester      │              │ - uploadedAt     │
│ - project        │              │ - uploadedBy     │
│ - status         │              │ - project        │
└──────────────────┘              └──────────────────┘
```

---

## 3. Système de Rôles et Permissions

### 3.1 Hiérarchie des Rôles

| Rôle | Description | Permissions Principales |
|------|-------------|------------------------|
| **SUPER_ADMIN** | Administrateur système | Accès total, gestion des organisations, utilisateurs, paramètres système |
| **ORG_ADMIN** | Administrateur d'organisation | Gestion de son organisation, projets, membres |
| **PROJECT_MANAGER** | Chef de projet | Gestion des projets assignés, tâches, équipe du projet |
| **TEAM_MEMBER** | Membre d'équipe | Vue et modification de ses tâches, commentaires |
| **CLIENT** | Client | Vue limitée sur les projets auxquels il est assigné |

### 3.2 Restrictions d'Accès (Backend)

```java
// Exemple de restriction avec @PreAuthorize
@PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN')")
public ResponseEntity<?> createOrganization(...) { ... }

@PreAuthorize("hasAnyAuthority('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER')")
public ResponseEntity<?> createProject(...) { ... }

@PreAuthorize("isAuthenticated()")
public ResponseEntity<?> getMyTasks(...) { ... }
```

### 3.3 Contrôle d'Accès par Donnée

- **SUPER_ADMIN** : Voit uniquement les projets de l'organisation "Flow" (restriction spécifique)
- **ORG_ADMIN** : Voit uniquement les données de son organisation
- **PROJECT_MANAGER** : Accès aux projets qu'il gère
- **TEAM_MEMBER** : Accès aux tâches qui lui sont assignées
- **CLIENT** : Vue sur les projets auxquels il participe

---

## 4. Backend - Détails Techniques

### 4.1 Liste des Contrôleurs REST

| Contrôleur | Endpoint Base | Description |
|------------|---------------|-------------|
| `AuthController` | `/api/auth` | Inscription, connexion, déconnexion |
| `UserController` | `/api/users` | CRUD utilisateurs, gestion des rôles |
| `OrganizationController` | `/api/organizations` | CRUD organisations |
| `OrganizationMemberController` | `/api/organization-members` | Gestion des membres |
| `ProjectController` | `/api/projects` | CRUD projets, membres du projet |
| `TaskController` | `/api/tasks` | CRUD tâches, commentaires, assignations |
| `DashboardController` | `/api/dashboard` | Statistiques et activités |
| `NotificationController` | `/api/notifications` | Gestion des notifications |
| `MeetingController` | `/api/meetings` | Demandes de réunion |
| `ProjectDocumentController` | `/api/projects/*/documents` | Upload/téléchargement de documents |
| `EmailController` | `/api/email` | Envoi d'emails (test) |
| `SystemSettingsController` | `/api/system-settings` | Paramètres système |
| `TeamController` | `/api/team` | Gestion des équipes |

### 4.2 Exemples d'Opérations CRUD

#### 4.2.1 Utilisateurs (UserController)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/users` | Liste tous les utilisateurs |
| `GET` | `/api/users/{id}` | Récupère un utilisateur |
| `POST` | `/api/users` | Crée un nouvel utilisateur |
| `PUT` | `/api/users/{id}` | Met à jour un utilisateur |
| `DELETE` | `/api/users/{id}` | Désactive un utilisateur |
| `GET` | `/api/users/role/{role}` | Utilisateurs par rôle |

#### 4.2.2 Projets (ProjectController)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/projects` | Projets de l'utilisateur |
| `GET` | `/api/projects/{id}` | Détails d'un projet |
| `POST` | `/api/projects` | Crée un projet |
| `PUT` | `/api/projects/{id}` | Met à jour un projet |
| `DELETE` | `/api/projects/{id}` | Supprime un projet |
| `POST` | `/api/projects/{id}/members` | Ajoute un membre |
| `DELETE` | `/api/projects/{id}/members/{userId}` | Retire un membre |

#### 4.2.3 Tâches (TaskController)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/tasks` | Tâches de l'utilisateur |
| `GET` | `/api/tasks/{id}` | Détails d'une tâche |
| `POST` | `/api/tasks` | Crée une tâche |
| `PUT` | `/api/tasks/{id}` | Met à jour une tâche |
| `DELETE` | `/api/tasks/{id}` | Supprime une tâche |
| `PATCH` | `/api/tasks/{id}/status` | Change le statut |
| `POST` | `/api/tasks/{id}/assign/{userId}` | Assigne une tâche |
| `GET` | `/api/tasks/{id}/comments` | Liste les commentaires |
| `POST` | `/api/tasks/{id}/comments` | Ajoute un commentaire |

### 4.3 Mécanisme de Création Dynamique de Base de Données

Le projet utilise **JPA/Hibernate** avec la configuration suivante :

```properties
# application.properties
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

**Fonctionnement :**
1. **ddl-auto=update** : Hibernate analyse les entités Java et met à jour automatiquement le schéma de la base de données
2. Les tables sont créées/modifiées en fonction des annotations `@Entity`, `@Table`, `@Column`
3. Les relations sont gérées via `@OneToMany`, `@ManyToOne`, `@ManyToMany`
4. Les contraintes (FK, UNIQUE, NOT NULL) sont générées automatiquement

**Exemple d'Entité :**
```java
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne
    @JoinColumn(name = "project_manager_id")
    private User projectManager;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    private List<Task> tasks;
}
```

---

## 5. Système de Notifications

### 5.1 Flux des Notifications (Schéma Réel du Projet)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUX DES NOTIFICATIONS                               │
└─────────────────────────────────────────────────────────────────────────────┘

   UTILISATEUR                  BACKEND                      DESTINATAIRE    
   (Action)                     (Traitement)                 (Réception)     
      │                              │                              │         
      │  1. Crée une tâche           │                              │         
      ├─────────────────────────────▶│                              │         
      │                              │                              │         
      │                              │  2. TaskService.createTask() │         
      │                              ├──────────────────────────────┤         
      │                              │                              │         
      │                              │  3. Sauvegarder en DB        │         
      │                              ├──────────────────────────────┤         
      │                              │                              │         
      │                              │  4. NotificationService      │         
      │                              │     .createNotification()    │         
      │                              ├──────────────────────────────┤         
      │                              │                              │         
      │                              │  5. Créer NotificationEvent  │         
      │                              │     en base de données       │         
      │                              ├──────────────────────────────┤         
      │                              │                              │         
      │                              │              ┌───────────────┤         
      │                              │              │               ▼         
      │                              │              │    ┌──────────────────┐
      │                              │              │    │  Notification    │
      │                              │              │    │  stockée en DB   │
      │                              │              │    └──────────────────┘
      │                              │              │               │         
      │                              │              │               ▼         
      │                              │              │    ┌──────────────────┐
      │                              │              │    │ Frontend polling │
      │                              │              │    │ GET /notifications│
      │                              │              │    └──────────────────┘
      │                              │              │               │         
      │                              │              │               ▼         
      │                              │              │    ┌──────────────────┐
      │                              │              └───▶│ Badge + Dropdown │
      │                              │                   │ de notification  │
      │                              │                   └──────────────────┘
```

### 5.2 Types de Notifications

| Type | Événement Déclencheur | Destinataire |
|------|----------------------|--------------|
| `TASK_ASSIGNED` | Assignation d'une tâche | Membre assigné |
| `TASK_COMPLETED` | Tâche terminée | Chef de projet |
| `MEETING_REQUEST` | Demande de réunion | Chef de projet |
| `CLIENT_FEEDBACK` | Feedback client | Chef de projet |

### 5.3 Structure d'une Notification

```java
@Entity
public class NotificationEvent {
    private Long id;
    private User user;           // Destinataire
    private String type;         // Type d'événement
    private String title;        // Titre
    private String message;      // Message détaillé
    private String relatedEntityType;  // "TASK", "PROJECT", "MEETING"
    private Long relatedEntityId;      // ID de l'entité liée
    private boolean isRead;      // Statut de lecture
    private OffsetDateTime createdAt;
}
```

---

## 6. Frontend - Interface Utilisateur

### 6.1 Pages Principales

| Page | Route | Accessible par |
|------|-------|----------------|
| Connexion | `/login` | Tous |
| Dashboard | `/dashboard` | Tous (sauf CLIENT, TEAM_MEMBER) |
| Gestion Utilisateurs | `/users` | SUPER_ADMIN |
| Gestion Organisations | `/organizations` | SUPER_ADMIN |
| Projets | `/projects` | SUPER_ADMIN, ORG_ADMIN, PROJECT_MANAGER |
| Tâches | `/tasks` | Tous |
| Paramètres | `/settings` | SUPER_ADMIN |
| Vue Client | `/client/overview` | CLIENT |
| Tâches Team Member | `/team-member/tasks` | TEAM_MEMBER |
| Calendrier | `/team-member/calendar` | TEAM_MEMBER |

### 6.2 Composants Clés

- **MainLayout** : Layout principal avec navbar et sidebar
- **ProtectedRoute** : Composant de protection des routes par rôle
- **NotificationsDropdown** : Dropdown des notifications temps réel
- **ThemeToggle** : Basculement mode clair/sombre
- **FilterPopover** : Filtrage avancé des données

---

## 7. Démonstrations Vidéo Suggérées

### 7.1 Vidéos à Créer

1. **Authentification et Rôles** (2-3 min)
   - Connexion avec différents rôles (SUPER_ADMIN, PROJECT_MANAGER, TEAM_MEMBER, CLIENT)
   - Démontrer les différentes interfaces selon le rôle

2. **Gestion des Organisations** (2 min)
   - Créer une organisation
   - Ajouter/supprimer des membres
   - Activer/désactiver une organisation

3. **Gestion des Projets** (3-4 min)
   - Créer un projet
   - Ajouter des membres au projet
   - Upload de documents
   - Voir le détail d'un projet

4. **Gestion des Tâches** (3-4 min)
   - Créer une tâche
   - Assigner à un membre
   - Changer le statut (Kanban)
   - Ajouter des commentaires
   - Démontrer les notifications

5. **Vue Team Member** (2 min)
   - Voir mes tâches
   - Utiliser le calendrier
   - Demander une réunion

6. **Système de Notifications** (2 min)
   - Recevoir une notification
   - Ouvrir le détail
   - Marquer comme lu

7. **Mode Sombre** (1 min)
   - Basculer entre thème clair et sombre
   - Montrer la cohérence visuelle

---

## 8. Points Techniques Importants

### 8.1 Sécurité

- **JWT Authentication** : Tokens sécurisés pour chaque requête
- **Annotations @PreAuthorize** : Contrôle d'accès au niveau méthode
- **Validation des données** : Annotations `@Valid`, `@NotBlank`, etc.
- **CORS configuré** : Permettre les requêtes cross-origin

### 8.2 Performance

- **Transactions @Transactional** : Gestion des transactions DB
- **Lazy Loading** : Chargement paresseux des relations
- **Pagination** : Limiter les résultats des listes

### 8.3 Gestion des Erreurs

- **GlobalExceptionHandler** : Gestion centralisée des exceptions
- **Messages d'erreur clairs** : Retours utilisateur compréhensibles

---

## 9. Conclusion

**ProjectFlow** est une application complète de gestion de projets qui démontre :
- Une architecture MVC moderne avec Spring Boot
- Un frontend réactif avec React et TypeScript
- Un système de rôles et permissions robuste
- Des notifications en temps réel
- Un code maintenable et extensible

### Questions ?
