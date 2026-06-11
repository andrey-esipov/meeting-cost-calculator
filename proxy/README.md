# Burn Rate — Work IQ relay

A ~40-line CORS relay so the static Burn Rate site can call the **Work IQ A2A API**
(`https://workiq.svc.cloud.microsoft/a2a/`). The browser can't call that endpoint
directly: it's an agent endpoint and blocks cross-origin requests. The relay forwards
the **signed-in user's own `WorkIQAgent.Ask` token** (acquired by MSAL in the browser)
and adds the CORS headers the browser needs. **It stores no secrets.**

```
browser ──(WorkIQAgent.Ask token + A2A body)──▶ this relay ──▶ workiq.svc.cloud.microsoft/a2a/
        ◀──────────── JSON + CORS ─────────────┘
```

## Deploy (Azure Functions, ~5 min)

Prereqs: an Azure subscription and the [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local).

```bash
cd proxy
npm install
# create the Function App (Node 20, consumption plan)
az group create -n burn-rate -l eastus
az storage account create -n burnratestore$RANDOM -g burn-rate -l eastus --sku Standard_LRS
az functionapp create -n burn-rate-workiq -g burn-rate \
  --consumption-plan-location eastus --runtime node --runtime-version 20 \
  --functions-version 4 --storage-account <the storage account name>
# lock CORS to your site
az functionapp config appsettings set -n burn-rate-workiq -g burn-rate \
  --settings ALLOWED_ORIGIN=https://andrey-esipov.github.io
func azure functionapp publish burn-rate-workiq
```

Copy the published function URL (e.g. `https://burn-rate-workiq.azurewebsites.net/api/workiq`)
into `js/config.js` → `workIq.proxyUrl`.

> Cloudflare Workers alternative: the same logic is ~30 lines in a Worker
> (`fetch` handler that forwards `Authorization` + body to the upstream and sets
> CORS). Use whichever your team is happy hosting.

## Auth model

- **Default (this relay):** the SPA acquires a delegated token for
  `api://workiq.svc.cloud.microsoft/WorkIQAgent.Ask` via MSAL and the relay forwards it.
  No secrets anywhere.
- **Fallback (OBO):** if your tenant rejects SPA/public-client tokens for the Work IQ
  resource, switch to On-Behalf-Of: the SPA gets a token for the relay's *own* API
  scope, and the relay (a confidential client, with a secret in App Settings) exchanges
  it for a Work IQ token via the OBO flow before calling upstream. Only needed if the
  default returns `AADSTS` audience errors.

## Settings

| Setting | Purpose |
| --- | --- |
| `ALLOWED_ORIGIN` | Origin allowed to call the relay (your Pages URL). Lock this down. |
| `WORKIQ_ENDPOINT` | Optional upstream override (defaults to the public Work IQ A2A endpoint). |
