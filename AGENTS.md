# CEPRD Project Context

## Project Overview

**CEPRD** is a specialized web application designed for creating and managing Product Requirements Documents (PRDs) with integrated AI assistance. The application features a modern, three-pane interface that allows users to seamlessly navigate PRD sections, edit content, and collaborate with an AI copilot.

### Key Features
- **Structured PRD Editor:** tailored sections for TL;DR, Background, Goals, User Stories/Requirements, Milestones, and Glossary.
- **AI Copilot:** Integrated chat interface (`app/api/chat/route.ts`) to assist in generating and refining content.
- **Reactive State:** Client-side state management using `zustand` and `immer` for a responsive editing experience.
- **Resizable Layout:** A flexible UI built with `react-resizable-panels` to customize the workspace.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) primitives, [Lucide](https://lucide.dev/) icons.
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Validation:** [Zod](https://zod.dev/)
- **AI SDK:** [Vercel AI SDK](https://sdk.vercel.ai/docs) (`ai`, `@ai-sdk/google`)
- **Package Manager:** **Bun** (Strictly enforced)

## Building and Running

**IMPORTANT:** Always use `bun` for package management and script execution.

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build

# Start production server
bun start
```


## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.



## Development Conventions

### Coding Standards (Ultracite)

This project strictly adheres to **Ultracite** standards using **Biome**.

- **Linting & Formatting:**
  - Run `bun run lint` to check for issues.
  - Run `bun run format` (or `bun x ultracite fix`) to auto-format and fix issues.
- **Core Principles:**
  - **Type Safety:** Prefer explicit types; avoid `any`; use `as const` for immutables.
  - **Modern JS/TS:** Use `const`, arrow functions, optional chaining (`?.`), and nullish coalescing (`??`).
  - **React:** Functional components only; proper hook dependencies; semantic HTML.
  - **Async:** Always `await` promises; use `try-catch` for error handling.

### Directory Structure

- **`app/`**: Next.js App Router pages and API routes.
  - `api/chat/`: Endpoint for the AI Copilot.
  - `page.tsx`: Main application layout (Sidebar - Editor - Copilot).
- **`components/`**: React components.
  - `prd/`: Components specific to the PRD editor sections (e.g., `goal-list.tsx`, `requirement-list.tsx`).
  - `copilot/`: Components for the AI chat interface.
  - `ui/`: Reusable UI components (buttons, inputs, dialogs), mostly Radix UI wrappers.
- **`lib/`**: Utility libraries.
  - `store.ts`: Zustand store definition for PRD state.
  - `schemas.ts`: Zod schemas defining the PRD data model.
  - `utils.ts`: General helper functions.

## Key Files to Know

- **`lib/store.ts`**: The heart of the application's state. Contains the `usePRDStore` hook and actions for modifying every part of the PRD (Actors, Goals, Requirements, etc.).
- **`lib/schemas.ts`**: Defines the shape of the data. Refer to this when adding new fields or validating input.
- **`AGENTS.md`**: Contains detailed rules for AI agents and coding standards. **Read this if you are an AI assistant.**


## Other things

If you are unsure how to do something, use `gh_grep` to search code examples from GitHub.

When you need to search docs, use `context7` tools.
