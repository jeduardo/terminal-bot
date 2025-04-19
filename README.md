# Web Terminal Bot

A simulation of a broken operating system that uses Google Gemini to generate responses based on user commands.

## Project Structure

- [`frontend/`](frontend/README.md) - Contains the frontend application in React that simulates the terminal UI in the browser. 
- [`backend/`](backend/README.md) - Contains the backend server code responsible for interacting with Google Gemini, handling API requests, and serving the main application.

## Getting Started

### Prerequisites

- Node.js (v23+)
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

3. **Run the frontend** (in a separate terminal)
   ```bash
   npm install
   npm start
   ```

## Usage

- Open your browser to the application frontend URL (e.g., `http://localhost:3000`).
- Type commands into the simulated terminal. The backend forwards these commands to Google Gemini and returns generated responses, creating the illusion of a broken OS.

## Security Considerations & Risks

- **Authentication**: The backend API endpoints are currently not authenticated.
- **API Key Security**: The Gemini API key is stored in environment variables. Ensure these are properly secured in production deployments.

## Deployment Instructions

### Service

1. Create the service location:
   ```shell
   mkdir /srv/terminal-bot
   ```

2. Build the frontend assets and copy them to the service location:
   ```bash
   cd frontend
   npm run build
   mv build /srv/terminal-bot/public/
   ```

2. Set up environment variables:
   ```bash
   cp .env.example /srv/terminal-bot/.env.production
   # Edit .env.production with production settings
   ```

   ```conf
   # Required to use the Gemini models
   GOOGLE_GENERATIVE_AI_API_KEY=YOUR_API_KEY
   # Required to serve the React files
   FRONTEND_DIR=public
   ```

3. Prepare the service location
   ```bash
   cp backend/{package.json,server.js} /srv/terminal-bot/
   cd /srv/terminal-bot
   npm install
   ```

5. Add the systemd service file:
   ```bash
   cp deployment/terminal-bot.service /etc/systemd/system/
   systemctl enable terminal-bot
   systemctl start terminal-bot
   ```

### Docker

1. **Build the Docker image**
   ```bash
   docker build -f deployment/Dockerfile -t terminal-bot .
   ```

2. **Run the Docker container**
   ```bash
   docker run -d -p 8080:8080 --env-file /path/to/your/.env terminal-bot
   ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

