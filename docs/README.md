# Documentation

Start here. Every guide in this repository is listed below with the question it
answers.

## Getting started

| Document                                 | Answers                                        |
| ---------------------------------------- | ---------------------------------------------- |
| [development.md](development.md)         | How do I install and run this locally?         |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | How do I contribute, and what gates must pass? |
| [../README.md](../README.md)             | What is this product, and what can it do?      |

## Design and behaviour

| Document                                             | Answers                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| [architecture.md](architecture.md)                   | How is the code organised, and where does a change belong?         |
| [api.md](api.md)                                     | What endpoints exist, and what does a response look like?          |
| [frontend.md](frontend.md)                           | How do the React apps reach the API, and what owns an HTTP call?   |
| [frontend-theme-guide.md](frontend-theme-guide.md)   | How does the storefront theme system work, and how do I extend it? |
| [frontend-css-refactor.md](frontend-css-refactor.md) | What did the front-end CSS refactor change?                        |
| [adr/](adr/)                                         | Why was this decision made, and what were the alternatives?        |

## Quality and delivery

| Document                                     | Answers                                              |
| -------------------------------------------- | ---------------------------------------------------- |
| [testing.md](testing.md)                     | What test layers exist, and how do I write one?      |
| [ci-cd.md](ci-cd.md)                         | What does CI run, and how do I reproduce it locally? |
| [operations.md](operations.md)               | How do I run, probe, log and roll back a deployment? |
| [disaster-recovery.md](disaster-recovery.md) | How do I recover the database and restore service?   |
| [migrations.md](migrations.md)               | How does the database schema evolve after a release? |

## Security

| Document                         | Answers                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| [security.md](security.md)       | Authentication, secrets, CORS, rate limits, seeding policy. |
| [../SECURITY.md](../SECURITY.md) | How do I report a vulnerability?                            |

## Conventions

- Documents are Markdown, one topic each, and link to their neighbours.
- Backend operator commands are documented in
  [../backend/scripts/README.md](../backend/scripts/README.md), with the
  migration format next to the code in
  [../backend/scripts/migrations/README.md](../backend/scripts/migrations/README.md).
- New architecture decisions get an ADR instead of a code comment nobody reads:
  copy `adr/0001-layered-backend-architecture.md` and number the next one.
- A change that alters behaviour described here updates this documentation in
  the same pull request.
