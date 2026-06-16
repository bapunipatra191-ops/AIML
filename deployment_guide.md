# Unified Deployment Guide - Bapun's AI Restaurant & Hotel Hub

This guide explains how to deploy the FastAPI application, its static frontend files, and the MySQL database to production environments.

---

## Option 1: Containerized Deployment via Docker & Docker Compose (Recommended)
This method is perfect for local testing or deploying to any Virtual Private Server (VPS) such as AWS EC2, DigitalOcean, or Linode.

### Prerequisites
- Install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).

### Steps
1. Navigate to the project directory:
   ```bash
   cd c:/Users/bapun/OneDrive/Desktop/restaurant
   ```
2. Start both the MySQL database and the FastAPI application in the background:
   ```bash
   docker compose up -d --build
   ```
3. Open your browser and navigate to:
   `http://localhost:8000`
4. To stop the containers, run:
   ```bash
   docker compose down
   ```

> [!NOTE]
> Docker Compose automatically handles persistent database storage via a Docker volume named `mysql_data`, so your reviews and menu items will be saved even if you restart the containers.

---

## Option 2: Cloud Hosting via Render (Recommended for Free Tier Hosting)
Render allows you to host Python applications directly from a GitHub repository.

### Prerequisites
- Push your project code to a GitHub repository.
- Create a free account at [Render.com](https://render.com).

### Steps
1. Log in to Render and click **New** -> **Blueprint**.
2. Connect your GitHub repository.
3. Render will automatically read the `render.yaml` file in your repository and set up:
   - A Web Service running the FastAPI backend.
   - Prompts for your database connection settings (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB`).
4. **Database Setup**: You can spin up a free MySQL database on platforms like [Aiven.io](https://aiven.io/) or [PlanetScale](https://planetscale.com/) and paste the connection details into the Render prompts.
5. Once building is complete, Render will provide a public URL (e.g., `https://bapun-restaurant-hub.onrender.com`).

---

## Option 3: Hosting via Railway
Railway is another excellent, developer-friendly hosting platform.

### Steps
1. Log in to [Railway.app](https://railway.app) and create a new project.
2. Select **Provision MySQL** to spin up a managed database.
3. Select **Deploy from GitHub** and connect your repository.
4. Railway will detect the `Dockerfile` and build the container automatically.
5. In your FastAPI service configuration on Railway, add variables referencing the MySQL service:
   - `MYSQL_HOST` = `${{MySQL.MYSQLHOST}}`
   - `MYSQL_USER` = `${{MySQL.MYSQLUSER}}`
   - `MYSQL_PASSWORD` = `${{MySQL.MYSQLPASSWORD}}`
   - `MYSQL_DB` = `${{MySQL.MYSQLDATABASE}}`
   - `MYSQL_PORT` = `${{MySQL.MYSQLPORT}}`
6. Add a public domain name in the Settings tab of your web service, and the site will be live!

---

## Option 4: Hosting via PythonAnywhere (Experimental ASGI Support)
PythonAnywhere now supports experimental ASGI (FastAPI) applications.

### Steps
1. Log in to [PythonAnywhere](https://www.pythonanywhere.com/).
2. Open a **Bash Console** and upgrade the PythonAnywhere command-line tools:
   ```bash
   pip install --upgrade pythonanywhere
   ```
3. Create a virtual environment and install the dependencies:
   ```bash
   mkvirtualenv restaurant-venv --python=python3.10
   pip install -r requirements.txt
   ```
4. Configure your MySQL database in the **Databases** tab on the PythonAnywhere dashboard. Note down the host, username, password, and database name.
5. Initialize the database schemas by running a python shell or setting environment variables.
6. Create the ASGI web app using the command line:
   ```bash
   pa-wsgi-to-asgi --domain YOUR_DOMAIN.pythonanywhere.com --app main:app --venv restaurant-venv
   ```
7. Configure your environment variables (`MYSQL_HOST`, `MYSQL_USER`, etc.) in the dashboard's WSGI/ASGI configuration file.
