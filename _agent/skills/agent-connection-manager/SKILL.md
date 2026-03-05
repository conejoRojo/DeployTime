---
description: "Control manual de conexión y estimación de tokens para subagentes externos (Claude Code / Codex)."
---

# 🛡️ Agent Connection & Token Manager Skill

Este skill es el **GUARDÍAN DE COSTOS Y CONEXIONES** del proyecto. 

## 🚨 CUÁNDO USAR ESTE SKILL
**OBLIGATORIO** usar este skill **ANTES** de despachar a cualquier subagente externo (Claude Code o Codex) utilizando skills como `subagent-driven-development` o `dispatching-parallel-agents`. 

## 📋 FLUJO DE TRABAJO (TUS REGLAS)

Cuando el usuario pida una tarea que deba ser delegada a Claude Code o a OpenAI Codex, **DETENTE** y sigue estos pasos exactamente en este orden:

### PASO 1: Calcular Estimación de Tokens
1. Estima la longitud del prompt que enviarás al agente externo y del contexto que le pasarás (tamaño de archivos).
2. Usa la siguiente regla heurística aproximada: **4 Caracteres ≈ 1 Token**.
3. Suma un 20% extra como margen de seguridad para la respuesta esperada del agente (Output Tokens).
4. El resultado será tu **`ESTIMACIÓN DE TOKENS`**.

### PASO 2: Verificar Conexión y Cuota Local
1. Ejecuta el script de verificación en terminal de la siguiente manera:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "./_agent/skills/agent-connection-manager/scripts/verify-tokens.ps1" -AgentName "claude" -EstimatedTokens <TUS_TOKENS_ESTIMADOS>
   ```
   *(Cambia "claude" por "codex" según corresponda).*
2. **Lee la salida del script.** El script analizará tu conexión CLI y si tienes tokens suficientes en el archivo `token-quota.json`.

### PASO 3: Chequeo con el Usuario (CHECKPOINT)
1. **Pausa tu ejecución y usa la herramienta `notify_user`.**
2. Preséntale al usuario el siguiente reporte (usa este formato):
   ```markdown
   ### 🛡️ Checkpoint de Agente Externo
   - **Agente a Ejecutar:** [Claude / Codex]
   - **Estado de Conexión:** [El resultado que arrojó el script]
   - **Estimación de esta tarea:** [X Tokens]
   - **Límite Mensual Configurado:** [Y Tokens]
   - **Saldo Disponible Hoy:** [Z Tokens]
   - **Fecha de Reinicio del Ciclo:** [DD/MM/YYYY]

   ¿Apruebas que despache esta tarea consumiendo aproximadamente esta cantidad de tokens? (Responde SÍ o NO). Si el estado de conexión dice "Desconectado", por favor ingresa al enlace provisto por el CLI para iniciar sesión y luego aprueba.
   ```
3. **ESPERA** la respuesta del usuario. **NO procedas ni cobres nada todavía.**

### PASO 4: Ejecución y Ajuste Real
1. Si el usuario responde **NO**, cancela la invocación del agente.
2. Si el usuario responde **SÍ**, procede a ejecutar tu comando de delegación (ej: `codex "prompt..."`).
3. Cuando el agente externo termine, lee cuidadosamente su **salida de terminal**. Busca la línea que diga "Token usage: total=965" o algo similar.
4. Ejecuta nuevamente el script, esta vez con el parámetro `-CommitUsage` para descontar *solamente* los tokens reales que el agente reportó haber consumido:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "./_agent/skills/agent-connection-manager/scripts/verify-tokens.ps1" -CommitUsage -RealTokens <TOKENS_REALES>
   ```

### ⚠️ REGLAS ESTRICTAS
- **NUNCA** automatices el paso de CHECKPOINT. El usuario SIEMPRE debe proveer un `SÍ` afirmativo antes de cada comando costoso.
- Documentar todas tus interacciones en **Castellano (Español)** como indica el usuario.
