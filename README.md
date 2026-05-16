### Hexlet tests and linter status:
[![Actions Status](https://github.com/mikaelo/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/mikaelo/ai-for-developers-project-386/actions)

## Development

Compile the TypeSpec contract and start a Prism mock API:

```bash
npm run compile
npm run mock
```

Start the frontend in a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL` and defaults to `http://127.0.0.1:4010`.
