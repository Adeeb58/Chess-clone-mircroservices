# IndiChess Backend

A microservices-based chess game backend with real-time multiplayer support.

## Architecture

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │     :8080       │
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐
           ▼                                   ▼
   ┌──────────────┐                   ┌──────────────┐
   │ User Service │                   │Match Service │
   │    :8081     │◄──────────────────│    :8082     │
   └──────┬───────┘                   └──────┬───────┘
          ▼                                  ▼
   ┌──────────────┐                   ┌──────────────┐
   │MySQL :3307   │                   │MySQL :3308   │
   │indichess_users│                  │indichess_matches│
   └──────────────┘                   └──────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8080 | Routes requests, JWT validation |
| User Service | 8081 | Authentication, user management |
| Match Service | 8082 | Game logic, WebSocket, matchmaking |

## Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+
- Docker & Docker Compose

### Build

```bash
# Build all modules
mvn clean package -DskipTests
```

### Run with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Run Locally (Development)

1. Start MySQL databases (ports 3307, 3308)
2. Run each service:
```bash
cd user-service && mvn spring-boot:run
cd match-service && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login, receive JWT

### Users
- `GET /users/me` - Get current user

### Games
- `POST /game` - Create/join game (matchmaking)
- `GET /game/{id}` - Get game state
- `POST /game/move/{id}` - Make a move
- `POST /game/{id}/resign` - Resign

### WebSocket
- `ws://localhost:8080/ws` - Real-time game updates
  - Send to: `/app/move`
  - Subscribe: `/topic/game/{gameId}`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| JWT_SECRET | (internal) | JWT signing key |
| MYSQL_HOST | localhost | MySQL hostname |
| MYSQL_PORT | 3306 | MySQL port |
| USER_SERVICE_URL | http://localhost:8081 | User service URL |
| MATCH_SERVICE_URL | http://localhost:8082 | Match service URL |

## Project Structure

```
├── common/           # Shared DTOs and exceptions
├── user-service/     # Authentication service
├── match-service/    # Game and matchmaking service
├── api-gateway/      # API Gateway
├── docker-compose.yml
└── pom.xml           # Parent POM
```
