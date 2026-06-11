import { GoogleGenerativeAI } from '@google/generative-ai'
import { sanitizeForAI } from '../utils/sanitizer'

export async function categorizeExpense(description, apiKey, categories) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API key not configured. Go to Settings to add it.')
  }

  const sanitized = sanitizeForAI(description)
  if (!sanitized || sanitized.length < 2) {
    throw new Error('Description is too short to categorize after stripping numbers.')
  }

  const genAI = new GoogleGenerativeAI(apiKey.trim())
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  })

  const categoryList = categories
    .filter(c => !c.isArchived)
    .map(c => `{"id":${c.id},"name":"${c.name}","pillar":"${c.pillar}","costType":"${c.costType}"}`)
    .join(',')

  const prompt = `You are a personal finance categorizer for an Indian household budget tracker.

Expense description: "${sanitized}"

Available subcategories: [${categoryList}]

Categorize the expense:
- mainCategory: one of "needs","wants","savings","investments"
- subCategoryId: best matching id from the list, or null
- costType: "fixed" if recurring/predictable (rent, EMI, subscriptions), "variable" if fluctuating (dining, shopping, fuel)
- confidence: float 0.0–1.0

Return only valid JSON: {"mainCategory":"string","subCategoryId":number_or_null,"costType":"string","confidence":number}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Unexpected AI response format.')

  const parsed = JSON.parse(jsonMatch[0])
  return parsed
}
