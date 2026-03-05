---
description: Flujo de trabajo unificado para características complejas, desde la idea hasta el código integrado (Happy Path).
---

# Complex Development Workflow (Happy Path)

This workflow provides a step-by-step unified approach for handling complex features, guiding the interaction from the initial idea all the way to merging the code.
*Nota para humanos: Flujo de desarrollo completo paso a paso (happy path).*

## Steps

1. **Brainstorming**: Run `/brainstorm` to explore the context, validate approaches, and design. *(Ejecutar /brainstorm para explorar contexto, validar enfoques y diseñar).*
2. **Planning**: Run `/write-plan` to create granular tasks (TDD, bite-sized tasks). *(Ejecutar /write-plan para crear tareas granulares).*
3. **Execution Strategy**: Confirm execution strategy between same session vs. parallel session. *(Confirmar estrategia de ejecución: misma sesión vs. sesión paralela).*
4. **Execution**: Run `/execute-plan` or start `subagent-driven-development`. *(Ejecutar /execute-plan o iniciar subagent-driven-development).*
5. **Code Review**: Request code review once implemented. *(Solicitar review de código una vez implementado).*
6. **Integration**: Use `finishing-a-development-branch` to merge and integrate. *(Usar finishing-a-development-branch para integrar).*
