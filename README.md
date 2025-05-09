# Terminal Bot

[![codecov](https://codecov.io/gh/jeduardo/terminal-bot/graph/badge.svg?token=5L0A8MZCBW)](https://codecov.io/gh/jeduardo/terminal-bot) [![CodeQL](https://github.com/jeduardo/terminal-bot/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/jeduardo/terminal-bot/actions/workflows/github-code-scanning/codeql) [![Dependabot](https://github.com/jeduardo/terminal-bot/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/jeduardo/terminal-bot/actions/workflows/dependabot/dependabot-updates) [![AI Code Review](https://github.com/jeduardo/terminal-bot/actions/workflows/code-review.yml/badge.svg)](https://github.com/jeduardo/terminal-bot/actions/workflows/code-review.yml) [![Tests](https://github.com/jeduardo/terminal-bot/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/jeduardo/terminal-bot/actions/workflows/test-coverage.yml) [![Server Deploy](https://github.com/jeduardo/terminal-bot/actions/workflows/deploy.yml/badge.svg)](https://github.com/jeduardo/terminal-bot/actions/workflows/deploy.yml)

Terminal Bot is a simulation of a DOS session using the Gemini LLM models from Google.

## Project Structure

- [`frontend/`](frontend/README.md) - Contains the frontend application in React that simulates the terminal UI in the browser.
- [`backend/`](backend/README.md) - Contains the backend server code responsible for interacting with Google Gemini, handling API requests, and serving the main application.

## Getting Started

### Prerequisites

- Node.js (v20+)
- npm
- A [Gemini API Key](https://aistudio.google.com/app/apikey)

### Local development

1. **Clone this repository**

   ```bash
   git clone http://github.com/jeduardo/terminal-bot.git
   cd terminal-bot
   ```

2. **Configure the backend**

   ```bash
   cp backend/.env.example backend/.env
   # Edit the .env file to have your Gemini API key
   ```

3. **Run the backend**

   ```bash
   cd backend
   npm install
   npm start
   ```

4. **Run the frontend** (in a separate terminal)
   ```bash
   npm install
   npm start
   ```

## Usage

- Open your browser to the application frontend URL (e.g., `http://localhost:3000`).
- Type commands into the simulated terminal. The backend forwards these commands to Google Gemini and returns generated responses, creating the illusion of a DOS session.

## Security Considerations & Risks

- **Authentication**: The backend API endpoints are currently not authenticated. This is by design, as the backend works primarily to protect the Gemini API key.
- **API Key Security**: The Gemini API key is stored in environment variables. Ensure these are properly secured in production deployments.

## Deployment Instructions

### Linux service

1. Create the service location and service user:

   ```shell
   # Create user
   sudo groupadd --system terminal-bot
   sudo useradd --system -g terminal-bot terminal-bot
   sudo usermod -d /srv/terminal-bot terminal-bot
   sudo usermod --shell /bin/bash terminal-bot
   sudo mkdir /srv/terminal-bot
   ```

2. Build the frontend assets and copy them to the service location:

   ```bash
   cd frontend
   npm install
   npm run build
   sudo mv build /srv/terminal-bot/public/
   cd ..
   ```

3. Set up environment variables:

   ```bash
   sudo cp backend/.env.example /srv/terminal-bot/.env.production
   # Edit .env.production with production settings
   ```

   ```conf
   # Required to use the Gemini models
   GOOGLE_GENERATIVE_AI_API_KEY=YOUR_API_KEY
   # Required to serve the React files
   FRONTEND_DIR=public
   ```

4. Prepare the service location

   ```bash
   sudo cp backend/{package.json,server.js} /srv/terminal-bot/
   cd /srv/terminal-bot
   sudo npm install
   cd -
   ```

5. Add the systemd service file:

   ```bash
   sudo cp deployment/terminal-bot.service /etc/systemd/system/
   sudo systemctl enable terminal-bot
   sudo systemctl start terminal-bot
   ```

6. Fix ownership:

   ```bash
   sudo chown terminal-bot:terminal-bot /srv/terminal-bot/ -R
   ```

7. (Optional) Add nginx passthrough if necessary:

   ```conf
   # rest of config
    location / {
        proxy_set_header   Host                $host;
        proxy_set_header   X-Real-IP           $remote_addr;
        proxy_set_header   X-Forwarded-For     $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto   $scheme;
        proxy_set_header   X-Forwarded-Host    $host;
        proxy_set_header   X-Forwarded-Port    $server_port;

        proxy_pass http://127.0.0.1:8080/;
   }
   # rest of config

   ```

### Docker Container

1. **Build the Docker image**

   ```bash
   docker build -f deployment/Dockerfile -t terminal-bot .
   ```

2. **Run the Docker container**
   ```bash
   docker run -d -p 8080:8080 --env-file /path/to/your/.env terminal-bot
   ```

### Vercel

This repository comes with a `vercel.json` file instructing Vercel to build each part of the project separately.

To deploy this project on Vercel, import the Github repository and create all environment variables from [env.example](backend/env.example) using the Vercel control panel.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
