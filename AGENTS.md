# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Ludinator** is a festival management web app built with vanilla HTML5/Web Components, organized into three modules:

- **Crew** — volunteer & schedule management
- **Fest** — activities & ticket entry counting
- **Mioum** — snack bar inventory & cash register

Each festival edition is managed independently. Storage uses localStorage or IndexedDB (no backend).

## Tech stack

- Native Web Components (no JS framework)
- Bootstrap for responsive/mobile-first layout
- Vanilla JS / ES modules
- localStorage or IndexedDB for persistence

## Architecture

Strict hexagonal architecture per module:

```
src/
  <module>/
    domain/          # Pure domain: entities, value objects, aggregates — zero technical deps
    application/     # Use cases (application services)
    ports/           # Interface definitions (storage, UI events)
    adapters/
      ui/            # Web Components, DOM event handlers
      storage/       # localStorage / IndexedDB adapters
```

### DDD building blocks

- **Entities**: have identity (e.g., `Volunteer`, `Post`, `Activity`)
- **Value Objects**: immutable, equality by value (e.g., `TimeSlot`, `Price`)
- **Aggregates**: enforce invariants (e.g., `Post` owns its `TimeSlot`s and validates conflict-free assignment)
- **Use Cases**: orchestrate domain objects, call ports — never touch the DOM or storage directly

### Key invariant

A volunteer cannot be assigned to two posts at overlapping time slots. Conflict detection lives in the domain layer.

## Development method (mandatory)

Work **strictly TDD and iteratively**:

1. Model the domain for the feature
2. Write tests (before implementation)
3. Implement the minimum to pass tests
4. Refactor if needed
5. Stop and wait for validation before continuing

**Never generate the whole project at once.**

## Commands

> The project has no build toolchain yet. Update this section when one is added (e.g., Vite, npm scripts, Vitest).

Expected test command once configured:
```bash
npm test                        # run all tests
npm test -- --grep "Volunteer"  # run a single test by name
```
