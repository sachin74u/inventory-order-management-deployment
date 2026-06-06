# Inventory & Order Management System

A production-ready full-stack inventory and order management application built with React, FastAPI, PostgreSQL, Docker, and Docker Compose.

## Features

- Product CRUD with unique SKU validation
- Customer create/list/delete with unique email validation
- Order creation with multiple products
- Automatic order total calculation in the backend
- Automatic stock reduction when an order is created
- Inventory checks that prevent overselling
- Dashboard metrics for products, customers, orders, and low stock
- Responsive React UI with form validation and API feedback
- Fully containerized frontend, backend, and PostgreSQL services

## Tech Stack

- Frontend: React, Vite, JavaScript, lucide-react
- Backend: Python, FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL
- Containers: Docker, Docker Compose

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Run Locally With Docker Compose

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Update `POSTGRES_PASSWORD` in `.env`.

3. Build and start all services:

```bash
docker compose up --build
```

4. Open the app:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## API Endpoints

### Products

- `POST /products`
- `GET /products`
- `GET /products/{product_id}`
- `PUT /products/{product_id}`
- `DELETE /products/{product_id}`

### Customers

- `POST /customers`
- `GET /customers`
- `GET /customers/{customer_id}`
- `DELETE /customers/{customer_id}`

### Orders

- `POST /orders`
- `GET /orders`
- `GET /orders/{order_id}`
- `DELETE /orders/{order_id}`

### Utility

- `GET /dashboard`
- `GET /health`

## Deployment Guide

## Live Deployment Links

- GitHub repository: https://github.com/sachin74u/inventory-order-management-deployment
- Docker Hub backend image: https://hub.docker.com/r/sachin74u/inventory-api/tags
- Backend API: https://inventory-order-api-c6uc.onrender.com
- Backend API docs: https://inventory-order-api-c6uc.onrender.com/docs
- Frontend app: https://frontend-eight-inky-22.vercel.app

### Backend on Render

1. Push this repository to GitHub.
2. Create a PostgreSQL database on Render.
3. Create a new Web Service from the GitHub repository.
4. Set the root directory to `backend`.
5. Use this build command:

```bash
pip install -r requirements.txt
```

6. Use this start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

7. Add environment variables:

- `DATABASE_URL`: Render PostgreSQL external/internal connection string, using the SQLAlchemy format if needed.
- `CORS_ORIGINS`: Your deployed frontend URL.

### Frontend on Vercel

1. Import the GitHub repository in Vercel.
2. Set the root directory to `frontend`.
3. Set `VITE_API_BASE_URL` to the deployed backend API URL.
4. Deploy with the default Vite settings.

### Backend Docker Image on Docker Hub

```bash
docker build -t your-dockerhub-user/inventory-api:latest ./backend
docker login
docker push your-dockerhub-user/inventory-api:latest
```

## Submission Checklist

- GitHub repository link: https://github.com/sachin74u/inventory-order-management-deployment
- Docker Hub backend image link: https://hub.docker.com/r/sachin74u/inventory-api/tags
- Live frontend URL: https://frontend-eight-inky-22.vercel.app
- Live backend API URL: https://inventory-order-api-c6uc.onrender.com
