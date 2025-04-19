# Terminal Bot Frontend

This is the React-based frontend for the Terminal Bot project. It provides a user-friendly web interface to interact with the Terminal Bot API, allowing users to send commands and view responses in real time.

## Features

- Modern React UI for the Terminal Bot
- Real-time communication with the backend API
- Easy-to-use command input and output display

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 23 or higher recommended)
- [npm](https://www.npmjs.com/)

### Development Server

To run the frontend locally:

```bash
npm start
```

This will start the development server at `http://localhost:3000`.

### API Proxy Configuration

For development, a proxy is required to forward API requests to the backend and avoid CORS issues. The project includes a `proxy` field in `package.json` or a `setupProxy.js` file in `src/` to handle this.

- Ensure the backend API is running (by default at `http://localhost:8080`).
- The development server will proxy API requests (e.g., `/api/*`) to the backend.

If you need to adjust the proxy target, update the `proxy` setting in `package.json`:

```json
"proxy": "http://localhost:8080"
```

### Build

To build the project for production run:

```shell
npm run build
```

The production assets will be present under the `build/` directory.

## License

MIT