# AI Prompt Optimization Framework

This project provides a framework for optimizing AI prompts through automated testing and evaluation. It uses NestJS as the backend framework and leverages AI models to generate test cases, evaluate prompts, and optimize them for better performance.

## Features

- **Prompt Optimization**: Automatically improve prompts through iterative testing and refinement
- **Test Case Generation**: Create diverse test cases to validate prompt effectiveness
- **Interactive Testing**: Test optimized prompts through a conversational interface
- **Optimization History**: Track the evolution of prompts through the optimization process

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager

### Installation

```bash
# Install dependencies
pnpm install
```

### Configuration

Create a `.env` file in the root directory with your API keys:

```
AI_API_KEY=YOUR_API_KEY
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

## Usage

### Running the Prompt Optimization Example

```bash
# Generate test cases and optimize a prompt
pnpm run example:optimize-prompt
```

This will:

1. Generate test cases based on your configuration
2. Evaluate the prompt against these test cases
3. Optimize the prompt through multiple iterations
4. Save the optimized prompt and test cases to the `output` directory

### Testing the Optimized Prompt

```bash
# Test the optimized prompt in an interactive conversation
pnpm run example:test-conversation
```

This starts an interactive CLI where you can chat with the AI using the optimized prompt.

### Running the Full Test Flow

```bash
# Run the complete test flow (optimization + conversation test)
pnpm run example:test-flow
```

### Viewing Optimization History

```bash
# View the history of optimization steps
pnpm run example:view-history
```

## Project Structure

- `src/examples/optimize-prompt/`: Example implementation of prompt optimization
- `src/core/`: Core models and interfaces
- `src/agent/`: Services for interacting with AI models
- `output/`: Generated test cases and optimized prompts

## Development

```bash
# Run in development mode with hot reload
pnpm run start:dev

# Build the project
pnpm run build

# Run tests
pnpm run test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is [MIT licensed](LICENSE).
