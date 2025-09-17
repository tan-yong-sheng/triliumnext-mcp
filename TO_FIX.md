
- add README.md under tests/units/ , tests/integration/ and tests/e2e/ respectively to highlight the standard for creating those tests (=unit testing standard, integration testing standard, e2e testing standard) respectively
- add README.md under src/ by mving docs/architecture.md so that claude can understand the code structure better...

- update to CLAUDE.md about never editing the tests when fail unless user explicitly requested, or you ask for approval to implement the changes to the tests since there is breaking changes to the codebase... (make this prompt clearer)

- in future, we could have easy way to manage calendar note or board note via LLM via predefined instruction like introducing `resolve_intent` function which returns suggested params when people say they want to create/manage calendar note or board note.... 

- create responseFormatter.ts for manage response structure of all mcp functions
- what's the logic for tests/validation.test.js, is it unit testing? If so, update the info about it at CLAUDE.md