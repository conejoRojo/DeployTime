# Implementation Plan: FTP + Secure Webhook Deployment

## 1. Secure Webhook (Backend)
- Create a new API endpoint `POST /api/deploy`.
- Validate a `X-Deploy-Token` header against a `DEPLOY_TOKEN` environment variable.
- If invalid, return 401 Unauthorized immediately to prevent malicious access.
- If valid, securely execute:
  1. `php artisan migrate --force`
  2. `php artisan config:cache`
  3. `php artisan route:cache`
  4. `php artisan view:cache`
- Return the command outputs as a JSON response for GitHub Actions to log.

## 2. GitHub Actions (CI/CD)
- Delete the old `deploy-ssh.yml` workflow.
- Create a new `deploy-ftp.yml` workflow.
- Step 1: Install PHP and run `composer install --no-dev --optimize-autoloader`.
- Step 2: Use `SamKirkland/FTP-Deploy-Action` to sync the `backend` folder to the server using the FTP credentials.
- Step 3: Run a `curl` command executing a POST request to `https://deploytime.dixer.net/api/deploy`, passing the `DEPLOY_TOKEN` as a header.

## Security Guarantees
- The PHP codebase is transferred securely via FTP/FTPS.
- The webhook cannot be brute-forced or triggered accidentally; it strictly requires a cryptographically secure token matching the `.env` file on the server.
- The Git repository will safely pass the secret in memory during the pipeline run.
