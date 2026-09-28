# File Vault

An Adobe App Builder app to **upload, list, download, and delete files**, built on the
`@adobe/aio-sdk` Files SDK with an ExC Shell React Spectrum UI.

## What it does

- **Upload** files via drag-and-drop or a file picker
- **List** stored files with name, size, and upload time
- **Download** via short-lived presigned URLs
- **Delete** with a confirmation dialog

## Actions

| Action | Method | Purpose |
|---|---|---|
| `upload-file` | POST | Store a base64-encoded file in Files storage |
| `list-files` | GET | List stored files + presigned download URLs |
| `delete-file` | POST | Delete a file by name |

All actions require Adobe IMS auth (`require-adobe-auth: true`).

## Size limit

Runtime caps a web-action request at **1 MB**. Because base64 inflates bytes by ~33%,
uploads are capped at **700 KB per file**, enforced in both the UI and the `upload-file`
action. For larger files you'd switch to presigned upload URLs (client uploads straight
to storage) — ask and I'll wire that up.

## Develop & deploy

```bash
npm install
npm test              # unit tests for all three actions
aio app use           # select org / project / workspace
aio app run           # local dev (Files SDK requires this, not `aio app dev`)
aio app deploy        # build + deploy to Runtime + CDN
```

`aio app deploy` writes the live action URLs into `web-src/src/config.json`; the UI reads
them from there. The file ships as `{}` and is filled at deploy/preview time.
