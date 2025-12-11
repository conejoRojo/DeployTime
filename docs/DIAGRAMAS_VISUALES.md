# DIAGRAMAS VISUALES DEL PIPELINE DE SEGURIDAD

## Diagrama 1: Arquitectura de Alto Nivel

```
┌────────────────────────────────────────────────────────────────────────┐
│                          GITHUB REPOSITORY                              │
│                          conejoRojo/DeployTime                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
                  PUSH             PR          MANUAL
                   │               │               │
                   └───────────────┴───────────────┘
                                    │
                                    │ Trigger
                                    ▼
        ┌────────────────────────────────────────────────────────────┐
        │         .github/workflows/security-scan.yml                │
        │                                                            │
        │  ┌──────────────────────────────────────────────────┐    │
        │  │           PERMISSIONS                            │    │
        │  │  • contents: read                                │    │
        │  │  • security-events: write                        │    │
        │  │  • pull-requests: write                          │    │
        │  │  • actions: read                                 │    │
        │  └──────────────────────────────────────────────────┘    │
        │                                                            │
        │  ┌──────────────────────────────────────────────────┐    │
        │  │              JOBS (Paralelos)                    │    │
        │  │                                                  │    │
        │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │    │
        │  │  │ semgrep  │  │  trivy   │  │ detect-  │      │    │
        │  │  │  -sast   │  │   -sca   │  │ secrets  │      │    │
        │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘      │    │
        │  │       │             │             │             │    │
        │  │       ▼             ▼             ▼             │    │
        │  │  semgrep.     trivy-*.sarif  .secrets.         │    │
        │  │   sarif                       baseline         │    │
        │  │       │             │             │             │    │
        │  │       └─────────────┴─────────────┘             │    │
        │  │                     │                           │    │
        │  │                     ▼                           │    │
        │  │          ┌────────────────────┐                │    │
        │  │          │ security-summary   │                │    │
        │  │          └────────────────────┘                │    │
        │  └──────────────────────────────────────────────────┘    │
        └────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐  ┌──────────┐  ┌───────────┐
            │   GitHub     │  │ Semgrep  │  │    PR     │
            │   Security   │  │  Cloud   │  │ Comments  │
            │     Tab      │  │ Platform │  │           │
            └──────────────┘  └──────────┘  └───────────┘
```

## Diagrama 2: Flujo de Semgrep SAST

```
┌─────────────────────────────────────────────────────────────────────┐
│                        JOB: semgrep-sast                            │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────┐
   │   Checkout   │  actions/checkout@v4
   │    codigo    │  fetch-depth: 0
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────────────────────────┐
   │         Ejecutar Semgrep SAST                    │
   │                                                  │
   │  semgrep/semgrep-action@v1                       │
   │                                                  │
   │  CONFIG:                                         │
   │  ├─> p/owasp-top-ten   (OWASP Top 10)          │
   │  ├─> p/php             (PHP rules)              │
   │  ├─> p/laravel         (Laravel specific)       │
   │  ├─> p/javascript      (JS rules)               │
   │  ├─> p/react           (React specific)         │
   │  ├─> p/sql-injection   (SQL injection)          │
   │  ├─> p/xss             (XSS detection)          │
   │  └─> p/security-audit  (General audit)          │
   │                                                  │
   │  TOKENS:                                         │
   │  ├─> publishToken: SEMGREP_APP_TOKEN            │
   │  └─> env: GITHUB_TOKEN                          │
   └──────────────┬───────────────────────────────────┘
                  │
                  ├────────────────────┬─────────────────┐
                  │                    │                 │
                  ▼                    ▼                 ▼
          ┌────────────┐      ┌────────────┐    ┌──────────┐
          │  Semgrep   │      │   GitHub   │    │semgrep   │
          │   Cloud    │      │  Security  │    │ .sarif   │
          │  Platform  │      │    API     │    │ (local)  │
          └────────────┘      └────────────┘    └────┬─────┘
                                                      │
                                                      ▼
                                      ┌───────────────────────────┐
                                      │ Upload SARIF to GitHub    │
                                      │ codeql-action@v4          │
                                      └────────────┬──────────────┘
                                                   │
                                                   ▼
                                      ┌────────────────────────────┐
                                      │   GitHub Security Tab      │
                                      │   • View findings          │
                                      │   • Track over time        │
                                      │   • Assign to team         │
                                      └────────────────────────────┘
```

## Diagrama 3: Flujo de Trivy SCA

```
┌──────────────────────────────────────────────────────────────────┐
│                       JOB: trivy-sca                             │
└──────────────────────────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────┐
   │   Checkout   │
   │    codigo    │
   └──────┬───────┘
          │
          ├────────────────┬────────────────┬──────────────────┐
          │                │                │                  │
          ▼                ▼                ▼                  │
   ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐     │
   │  Scan PHP    │ │  Scan Node   │ │  Scan Docker    │     │
   │  Backend     │ │  Desktop     │ │  Config         │     │
   └──────┬───────┘ └──────┬───────┘ └────────┬────────┘     │
          │                │                   │              │
          ▼                ▼                   ▼              │
   ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐     │
   │composer.lock │ │package-lock  │ │Dockerfile.dev   │     │
   │ 113 deps     │ │  .json       │ │                 │     │
   │              │ │ 541 deps     │ │                 │     │
   └──────┬───────┘ └──────┬───────┘ └────────┬────────┘     │
          │                │                   │              │
          │    Trivy DB    │       Trivy DB    │   Trivy DB  │
          │    ┌────────┐  │      ┌────────┐   │  ┌────────┐ │
          ├───>│  CVE   │  ├─────>│  CVE   │   ├─>│ Config │ │
          │    │Database│  │      │Database│   │  │ Rules  │ │
          │    └────────┘  │      └────────┘   │  └────────┘ │
          ▼                ▼                   ▼              │
   ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐     │
   │trivy-php-    │ │trivy-node-   │ │trivy-docker-    │     │
   │results.sarif │ │results.sarif │ │results.sarif    │     │
   └──────┬───────┘ └──────┬───────┘ └────────┬────────┘     │
          │                │                   │              │
          └────────────────┴───────────────────┴──────────────┘
                                    │
                                    ▼
                      ┌──────────────────────────┐
                      │ Upload 3 SARIFs          │
                      │ Categories:              │
                      │ • trivy-php              │
                      │ • trivy-node             │
                      │ • trivy-docker           │
                      └────────┬─────────────────┘
                               │
                               ▼
                      ┌──────────────────────────┐
                      │  GitHub Security Tab     │
                      │  • View by category      │
                      │  • Filter by severity    │
                      │  • Track remediation     │
                      └──────────────────────────┘
```

## Diagrama 4: Flujo de detect-secrets

```
┌──────────────────────────────────────────────────────────────────┐
│                    JOB: detect-secrets                           │
└──────────────────────────────────────────────────────────────────┘
          │
          ▼
   ┌──────────────┐
   │   Checkout   │  fetch-depth: 0
   │    codigo    │  (historial completo)
   └──────┬───────┘
          │
          ▼
   ┌──────────────────┐
   │    Instalar      │  pip install detect-secrets
   │  dependencias    │  apt-get install jq
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────────────────────────────────┐
   │    Escanear secretos en el codigo            │
   │                                              │
   │  ¿Existe .secrets.baseline?                  │
   │         /              \                    │
   │       SI               NO                    │
   │       │                 │                    │
   │       ▼                 ▼                    │
   │  Scan incremental   Scan completo            │
   │  (solo nuevos)      (todo el repo)           │
   └──────┬──────────────────┬────────────────────┘
          │                  │
          └──────────┬───────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  .secrets.baseline  │
          │                     │
          │  {                  │
          │    "results": {     │
          │      "file1": [...],│
          │      "file2": [...]│
          │    }                │
          │  }                  │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  Verificar con jq   │
          │                     │
          │  SECRET_COUNT=$(    │
          │    jq '.results |   │
          │    to_entries |     │
          │    map(.value |     │
          │    length) |        │
          │    add // 0'        │
          │  )                  │
          └──────────┬──────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
   count = 0                count > 0
         │                       │
         ▼                       ▼
   ┌──────────┐           ┌──────────┐
   │   PASS   │           │   FAIL   │
   │  exit 0  │           │  exit 1  │
   └────┬─────┘           └────┬─────┘
        │                      │
        ▼                      ▼
   ┌─────────────┐       ┌────────────────┐
   │ Comment PR  │       │  Comment PR    │
   │ "Sin        │       │  "19 secretos  │
   │  secretos"  │       │   detectados"  │
   └─────────────┘       └────────────────┘
```

## Diagrama 5: Tipos de Secretos Detectados

```
detect-secrets Heuristics
├─── Base64 High Entropy
│    ├─> JWT tokens
│    ├─> Encrypted keys
│    └─> Binary data encoded
│
├─── Hex High Entropy
│    ├─> API keys (hex format)
│    ├─> Hashes
│    └─> Cryptographic salts
│
├─── Private Key Detector
│    ├─> -----BEGIN RSA PRIVATE KEY-----
│    ├─> -----BEGIN PRIVATE KEY-----
│    └─> -----BEGIN OPENSSH PRIVATE KEY-----
│
├─── AWS Key Detector
│    ├─> AKIA... (AWS Access Key)
│    └─> aws_secret_access_key
│
├─── Azure Storage Key
│    └─> DefaultEndpointsProtocol=https;...
│
├─── GCP Service Account
│    └─> AIza... (API keys)
│
├─── Generic API Key
│    ├─> api_key=...
│    ├─> apikey:...
│    └─> token=...
│
└─── Generic Secret
     ├─> password=...
     ├─> secret=...
     └─> auth_token=...
```

## Diagrama 6: Flujo de Resolucion de Problemas

```
                    PROBLEMA DETECTADO
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   SEMGREP FAIL       TRIVY FAIL        SECRETS FAIL
   (no SARIF)         (CVEs found)      (19 secrets)
        │                  │                  │
        ▼                  ▼                  ▼
   Fix workflow      Review CVEs         Audit secrets
        │                  │                  │
        ▼                  ▼                  ▼
   Add publishToken  Update deps       detect-secrets
   Add GITHUB_TOKEN  or suppress      audit .baseline
        │                  │                  │
        ▼                  ▼                  ▼
   Test workflow     Re-scan         Mark false positives
        │                  │                  │
        ▼                  ▼                  ▼
   Generate SARIF    Verify fixed     Remove real secrets
        │                  │                  │
        ▼                  ▼                  ▼
   Upload to GitHub  Document         Commit baseline
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   RE-RUN     │
                    │  WORKFLOW    │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │              │
              All PASS        Some FAIL
                    │              │
                    ▼              ▼
            ┌────────────┐  ┌──────────┐
            │   MERGE    │  │  BLOCK   │
            │  APPROVED  │  │  MERGE   │
            └────────────┘  └──────────┘
```

## Diagrama 7: Integracion con GitHub Security

```
┌──────────────────────────────────────────────────────────────────┐
│                    GITHUB SECURITY TAB                           │
└──────────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│ Code Scanning│  │  Dependabot    │  │   Secret     │
│    Alerts    │  │    Alerts      │  │  Scanning    │
└──────┬───────┘  └────────┬───────┘  └──────┬───────┘
       │                   │                  │
       ├─> Semgrep SAST    ├─> Trivy PHP     └─> GitHub native
       ├─> Trivy PHP       ├─> Trivy Node        + detect-secrets
       ├─> Trivy Node      └─> Auto PRs
       └─> Trivy Docker        for updates

┌──────────────────────────────────────────────────────────────────┐
│                        ALERT DETAILS                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Finding: SQL Injection in UserController.php         │    │
│  │  Severity: ERROR                                       │    │
│  │  Tool: Semgrep                                         │    │
│  │  Rule: php.lang.security.sql-injection                │    │
│  │  Location: Line 42, Column 15                          │    │
│  │                                                        │    │
│  │  Remediation:                                          │    │
│  │  • Use parameterized queries                           │    │
│  │  • Sanitize user input                                 │    │
│  │  • Use ORM methods instead of raw SQL                  │    │
│  │                                                        │    │
│  │  [Dismiss] [Create Issue] [Assign]                    │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## Diagrama 8: Timeline del Pipeline

```
Time (minutes)
0:00  ┬─ Trigger: git push main
      │
0:05  ├─ Job Start (parallel)
      │  ├─ semgrep-sast starts
      │  ├─ trivy-sca starts
      │  └─ detect-secrets starts
      │
0:30  ├─ detect-secrets completes (30s)
      │  └─ Result: 19 secrets found
      │
1:30  ├─ semgrep-sast completes (1m 30s)
      │  └─ Result: 3 findings
      │
3:00  ├─ trivy-sca completes (3m)
      │  └─ Result: Multiple CVEs
      │
3:05  ├─ security-summary starts
      │  └─ Waits for all 3 jobs
      │
3:15  ├─ security-summary completes (10s)
      │  └─ Generates consolidated report
      │
3:16  └─ Workflow completes
         └─ Results visible in:
            • Actions tab
            • Security tab
            • PR comments (if PR)
```

## Diagrama 9: Estructura de Archivos SARIF

```
semgrep.sarif
├─ version: "2.1.0"
├─ $schema: "https://..."
└─ runs: [
    {
      tool: {
        driver: {
          name: "Semgrep",
          version: "1.144.1",
          rules: [
            {
              id: "php.lang.security.sql-injection",
              shortDescription: "SQL Injection",
              fullDescription: "...",
              defaultConfiguration: {
                level: "error"
              }
            }
          ]
        }
      },
      results: [
        {
          ruleId: "php.lang.security.sql-injection",
          level: "error",
          message: {
            text: "Unsanitized input in SQL query"
          },
          locations: [{
            physicalLocation: {
              artifactLocation: {
                uri: "backend/app/Http/Controllers/..."
              },
              region: {
                startLine: 42,
                startColumn: 15,
                endLine: 42,
                endColumn: 50
              }
            }
          }],
          fixes: [{
            description: "Use parameterized query",
            artifactChanges: [...]
          }]
        }
      ]
    }
  ]
```

## Diagrama 10: Decision Tree - ¿Mergear o no?

```
                    WORKFLOW COMPLETES
                           │
                    ┌──────┴──────┐
                    │             │
              All jobs PASS    Some jobs FAIL
                    │             │
                    ▼             ▼
            ┌────────────┐  ┌──────────────┐
            │   CHECK    │  │  REVIEW      │
            │  SEVERITY  │  │  FAILURES    │
            └──────┬─────┘  └──────┬───────┘
                   │                │
      ┌────────────┴────┐          │
      │                 │          │
  No findings    Low severity      │
      │                 │          │
      ▼                 ▼          │
  ┌────────┐       ┌────────┐     │
  │ MERGE  │       │ REVIEW │     │
  │   OK   │       │  TEAM  │     │
  └────────┘       └───┬────┘     │
                       │          │
                       └──────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  CRITICAL/HIGH        MEDIUM            LOW/INFO
        │                   │                   │
        ▼                   ▼                   ▼
   ┌────────┐         ┌─────────┐        ┌─────────┐
   │ BLOCK  │         │ REVIEW  │        │  WARN   │
   │ MERGE  │         │  TEAM   │        │  MERGE  │
   └────────┘         └─────────┘        └─────────┘
```