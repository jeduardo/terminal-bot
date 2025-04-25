# Terminal Bot Backend

This is the backend service for **Terminal Bot**, a project intending to use AI models to simulate a DOS session.
This backend exposes a RESTful API and handles core logic, user management, and integration with external services.
It needs to exist to isolate the API key we use and to restrict what we want to send to the AI model and how it should react to it.
It also formats the output to JSON so we can use it in the frontend.

## Features

- Initial boot messages
- Configurable prompts and ports through `.env` files.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20.x
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
# Get boot messages
http http://localhost:8080/api/boot Content-Type:application/json

# Run a command from the current prompt 
http POST http://localhost:8080/api/system Content-Type:application/json command="dir" currentPrompt="c:\\" history='[{"role":"user","content":"ver"},{"role":"assistant","content":"MS-DOS Version 6.22"},{"role":"user","content":"echo lala > test.txt"},{"role":"user","content":"type test.txt"},{"role":"assistant","content":"lala"}]'
```

# Payload format

For both endpoints, the API returns JSON payloads with the following fields:

* commandPrompt: `string`, content of the shell prompt after command execution or boot
* response: `array` of `string`, each line corresponding to the output of a command

## License

This project is licensed under the MIT License.
