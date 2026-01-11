# Event Management System

A Node.js backend service for managing events and users with Fastify framework.

## Features

- User management
- Event creation and retrieval
- User-specific event queries
- Circuit breaker pattern for external service resilience
- Performance optimizations for event queries

## Tech Stack

- **Framework**: Fastify (v4.28.0) - Fast and low overhead web framework
- **Testing**: MSW (Mock Service Worker) - API mocking library
- **Runtime**: Node.js

## Installation

```bash
npm install
```

## Usage

Start the development server:

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### GET /getUsers
Returns list of all users.

```bash
curl http://localhost:3000/getUsers
```

### GET /getEvents  
Returns list of all events.

```bash
curl http://localhost:3000/getEvents
```

### GET /getEventsByUserId/:id
Returns events for a specific user ID. Optimized for performance with parallel API calls.

```bash
curl http://localhost:3000/getEventsByUserId/1
```

### POST /addEvent
Creates a new event. Includes circuit breaker pattern for handling external service failures.

```bash
curl --location --request POST 'http://localhost:3000/addEvent' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Meeting with team",
    "userId": "1"
}'
```

## Architecture Decisions

### Performance Optimizations
- **Parallel API calls**: `/getEventsByUserId` now makes concurrent requests instead of sequential ones
- **Request batching**: Multiple event requests are processed simultaneously

### Resilience Patterns
- **Circuit breaker**: Implemented for `/addEvent` to handle external service failures
- **Automatic recovery**: Service gradually resumes normal operations when external API recovers
- **Failure detection**: Monitors consecutive failures within time windows

### Error Handling
- **Graceful degradation**: Appropriate error responses when external services are unavailable
- **Structured logging**: Consistent error logging with timestamps
- **Status code mapping**: Proper HTTP status codes for different failure scenarios

## Development

The project uses MSW to mock external APIs for development and testing:
- External service simulation with controlled failure scenarios
- Configurable delays to test performance optimizations
- Request counting for circuit breaker testing

## Testing Circuit Breaker

1. Make multiple POST requests to `/addEvent` (>5 requests)
2. Observe automatic circuit opening after failures
3. Wait for gradual recovery and circuit closing
