---
description: Árbol de decisión para seleccionar el flujo de trabajo adecuado según la etapa del proyecto.
---

# Project Decision Matrix Workflow

This workflow acts as a decision tree guiding the user on which tools and agents to utilize depending on the current project phase.
*Nota para humanos: Este árbol de decisión ayuda a elegir la herramienta adecuada según la fase del proyecto.*

## Decision Tree by Phase

1. **Idea Phase** *(Fase de Idea)*: 
   - Workflow: `brainstorming` -> `writing-plans`

2. **Bugfix/Maintenance Phase** *(Fase de Bugfix/Mantenimiento)*: 
   - Workflow: `systematic-debugging`

3. **Execution Phase (Parallel Bugs)** *(Fase de Ejecución - Múltiples bugs paralelos)*: 
   - Workflow: `dispatching-parallel-agents`

4. **Execution Phase (Large Sequential Feature)** *(Fase de Ejecución - Feature secuencial grande)*: 
   - Workflow: `subagent-driven-development` OR `executing-plans`

5. **Closing Phase** *(Fase de Cierre)*: 
   - Workflow: `requesting-code-review` -> `finishing-a-development-branch`
