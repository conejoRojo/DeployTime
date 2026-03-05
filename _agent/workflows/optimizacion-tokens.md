---
description: Guía y flujo de trabajo para la optimización y gestión de tokens y modelos.
---

# Token Optimization and Model Selection Workflow

This workflow guides the agent and user in selecting the appropriate model and managing token usage effectively. 
*Nota para humanos: Esta guía detalla cómo administrar el presupuesto de tokens, cuándo iniciar nuevos chats y cómo alternar entre modelos (especialmente en entornos CLI como Claude Code).*

## Model Selection Guidelines

- **Haiku**: Use for atomic tasks, quick analysis, and specific queries. *(Cuándo usar Haiku: Tareas atómicas, análisis rápido, consultas puntuales).*
- **Sonnet**: Use for planning, moderate refactoring, and guided task execution. *(Cuándo usar Sonnet: Planificación, refactorización moderada, ejecución guiada de tareas).*
- **Opus**: Use for deep architecture design, complex debugging (max 3 failed attempts), and writing highly sophisticated initial code. *(Cuándo usar Opus: Arquitectura profunda, debug complejo (3 intentos fallidos máximo), escritura de código inicial muy sofisticado).*

## Context Management

- **Compacting or New Chat**: Evaluate context length frequently. Use `/compact` or start a new chat based on the recommended message limit according to complexity to avoid excessive API costs and degraded context window performance. *(Cuándo hacer /compact o nuevo chat: Límite recomendado de mensajes según complejidad).*
