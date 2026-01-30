# Hide

AI-powered development tool for your projects.

Hide is a desktop application that integrates Claude AI with the Model Context Protocol (MCP) to help developers automate coding tasks and accelerate their workflow.

## Features

- **Conversational AI Interface** - Multi-turn chat with Claude, streaming responses, and conversation history
- **Project Management** - Organize conversations by project with directory context
- **Tool Integration** - Execute development tools through MCP (file operations, shell commands, and more)
- **Multiple Claude Models** - Support for Claude 3.7 Sonnet, Claude 3.5 Sonnet, and Claude 3.5 Haiku
- **Extended Thinking** - Optional deep reasoning mode for Claude 3.7
- **Dark/Light Themes** - Full theme support with system preference detection

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Radix UI, Framer Motion
- **Desktop**: Electron 33, Electron Forge
- **AI/Tools**: Anthropic SDK, Model Context Protocol SDK
- **Database**: SQLite (better-sqlite3)

## Prerequisites

- Node.js (v18 or later recommended)
- npm
- Anthropic API key
- [hide-mcp](https://github.com/hide-org/hide-mcp) package (for tool execution)

## Installation

```bash
# Clone the repository
git clone https://github.com/hide-org/hide-app.git
cd hide-app

# Install dependencies
npm install

# Set up environment variables
cp .env.template .env
```

Edit `.env` with your configuration:

```bash
ANTHROPIC_API_KEY=your_api_key_here
LOCAL_MCP_PATH=/path/to/hide-mcp
HIDE_SHELL=/bin/zsh
```

## Development

```bash
# Start the app in development mode
npm run start

# Run linter
npm run lint

# Rebuild native modules (after dependency changes)
npm run rebuild
```

## Building

```bash
# Package the app
npm run package

# Create distributable installers
npm run make
```

Build outputs:
- Development: `.webpack/`
- Packaged app: `out/`

### Supported Platforms

- macOS (with code signing and notarization)
- Windows (Squirrel installer)
- Linux (DEB and RPM packages)

## Project Structure

```
src/
├── index.ts              # Electron main process entry
├── renderer.ts           # React app entry
├── preload.ts            # Electron preload (IPC bridge)
├── app.tsx               # Root React component
├── components/           # React UI components
├── main/                 # Main process logic
│   ├── db.ts             # SQLite database
│   ├── mcp.ts            # MCP client
│   ├── services/         # Core services (chat, anthropic, analytics)
│   └── migrations/       # Database migrations
├── lib/                  # Utilities and helpers
├── hooks/                # React hooks
└── types/                # TypeScript interfaces
```

## Configuration

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Claude API key (required) |
| `LOCAL_MCP_PATH` | Path to hide-mcp package |
| `HIDE_SHELL` | Shell for command execution (e.g., `/bin/zsh`) |
| `HIDE_MCP_LOG_LEVEL` | MCP logging level (`INFO`, `DEBUG`, etc.) |
| `HIDE_APP_DEBUG` | Enable debug logging (`true`/`false`) |

## License

MIT
