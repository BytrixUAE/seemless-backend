# Backend-Boilerplate

## How to Run This Project

### Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v14 or higher recommended)
- **MySQL** (v5.7 or higher)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd seemless_backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Environment Setup

1. **Create a `.env` file** in the root directory with the following variables:


2. **Update the values** in `.env` with your actual configuration.

### Database Setup

1. **Create a MySQL database**:
   ```sql
   CREATE DATABASE seemless;
   ```

2. **The database tables will be automatically created** when you run the server for the first time using Sequelize sync.

### Running the Project

#### Development Mode

Run the project in development mode with auto-reload:

```bash
npm run dev
```

This will start the server using `nodemon`, which automatically restarts the server when you make changes to the code.

#### Production Mode

For production, you can run:

```bash
node server.js
```

Or use a process manager like PM2:

```bash
pm2 start server.js --name seemless-backend
```

### Database Sync Options

The server supports database synchronization options:

- **Normal sync** (default): Tables are created if they don't exist
  ```bash
  npm run dev
  ```

- **Alter sync**: Updates existing tables to match models
  ```bash
  node server.js --alter
  ```

- **Force sync**: Drops and recreates all tables (⚠️ **WARNING**: This will delete all data!)
  ```bash
  node server.js --force
  ```

### Server Information

Once the server is running, you should see:

```
Server is running on PORT : <your_backend_port>
Drop and re-sync db.
```

The API will be available at:
- **Base URL**: `http://localhost:<BACKEND_PORT>`
- **API Routes**: `http://localhost:<BACKEND_PORT>/api/`

### Troubleshooting

1. **Port already in use**: Change the `BACKEND_PORT` in your `.env` file
2. **Database connection error**: Verify your database credentials in `.env`
3. **Module not found**: Run `npm install` again
4. **Permission errors**: Ensure MySQL user has proper permissions

---

# Module Generator

This project includes a module generator script to automate the creation and management of new modules and their respective database configurations.

## Requirements
Before you can use the module generator, ensure that:
- Node.js is installed on your system.
- Sequelize and your database are correctly set up and configured in your project.

## Usage

### 1. Generate a New Module

To generate a new module, use the following command in your terminal:

```bash
generate-module <ModuleName> <TableName>
```
##### ModuleName:
The name of the module you want to create. It should be written in PascalCase (e.g., User, Product, Order).

##### TableName:
The name of the database table that the module will interact with. Typically written in snake_case (e.g., users, products, orders).

## 2. Rollback a Module
  To rollback (delete) a module that was previously generated, use the following command:

```bash
rollback-module <ModuleName>
```
##### ModuleName:
The name of the module you want to remove (e.g., User, Product).

## 3. Generate Client Token
  To generate a new client_id, use the following command:

```bash
generate-client-token
```