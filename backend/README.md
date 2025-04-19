# Terminal Bot Backend

This is the backend service for **Terminal Bot**, a Node.js project designed to provide intelligent terminal automation and assistance. This backend exposes a RESTful API and handles core logic, user management, and integration with external services.

## Features

- RESTful API for terminal automation
- Configurable environment

## Prerequisites

- [Node.js](https://nodejs.org/) >= 23.x
- [npm](https://www.npmjs.com/) >= 10.x

## Configuration

1. **Clone the repository:**
    ```bash
    git clone https://github.com/jeduardo/terminal-bot.git
    cd terminal-bot/backend
    ```

2. **Set environment variables:**

    Copy the`.env.example` file in the `backend` as `.env`, replacing your API key inside it.

3. **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Backend

```bash
npm start
```

The API will be available at `http://localhost:8080`.

## Testing the backend

You can use [HTTPie](https://httpie.io/) or any other URL client to test the backend, as below:

```shell
http --stream POST http://localhost:8080/api/chat \
  Content-Type:application/json \
  message="who are you"
```

## License

This project is licensed under the MIT License.
