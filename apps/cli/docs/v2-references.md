# v2 References

## Gemini API
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **URL Param:** `?key=<API_KEY>`
- **Structured Output Body:**
  ```json
  {
    "contents": [{ "role": "user", "parts": [{ "text": "Prompt here..." }] }],
    "generationConfig": {
      "responseMimeType": "application/json",
      "responseSchema": { /* JSON Schema definition */ }
    }
  }
  ```

## Cartwight Template File Shapes
### `brand.config.ts`
Exports a `brand` object which conforms to `BrandConfigSubset` from `@cartwright/shared` plus UI labels, policies, features, images, and email colors.

### `themes/generic.css`
Contains CSS variables for the color palette (`--color-accent`, `--color-cream`, `--color-sand`, `--color-ink`, `--color-muted`, `--color-success`).

### `lib/ai/prompts/generic.ts`
Exports `export const systemPrompt = \`...\`;`

### `industry-templates/generic/seed-data.ts`
Exports `export const seedData = { categories: [...], products: [...], pages: [...] };`

### `@cartwright/shared`
Exports:
- `promptAnswersSchema` and `PromptAnswers`
- `brandConfigSubsetSchema` and `BrandConfigSubset`
