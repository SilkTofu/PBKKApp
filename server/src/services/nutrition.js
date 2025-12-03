const axios = require('axios');

const MODEL_NAME = 'gpt-5.1-codex-preview';
const DEFAULT_ANALYSIS = {
  calories: 0,
  macronutrients: {
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
  },
  micronutrients: [],
  mealSummary: 'No analysis available.',
  recommendations: [],
};

const mapResponsePayload = (payload) => {
  if (!payload) {
    return DEFAULT_ANALYSIS;
  }

  const {
    calories = 0,
    macronutrients = {},
    micronutrients = [],
    mealSummary = 'No summary provided.',
    recommendations = [],
  } = payload;

  return {
    calories,
    macronutrients: {
      proteinGrams: macronutrients.proteinGrams || 0,
      carbsGrams: macronutrients.carbsGrams || 0,
      fatGrams: macronutrients.fatGrams || 0,
      fiberGrams: macronutrients.fiberGrams || 0,
    },
    micronutrients,
    mealSummary,
    recommendations,
  };
};

const buildPrompt = ({ mealName }) => `You are GPT-5.1-Codex (Preview), an elite nutritionist.
You will receive a user-uploaded food image encoded in base64 and metadata about the meal. 
Return a **strict** JSON object with:
{
  "calories": number,
  "macronutrients": {
    "proteinGrams": number,
    "carbsGrams": number,
    "fatGrams": number,
    "fiberGrams": number
  },
  "micronutrients": [ { "name": string, "amount": string } ],
  "mealSummary": string,
  "recommendations": string[]
}
Keep values realistic and reflect portion sizes.
Meal label: ${mealName || 'Untitled Meal'}.
`;

const callOpenAiVision = async (fileBuffer, metadata = {}) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('Missing OPENAI_API_KEY environment variable'), { status: 500 });
  }

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const base64Image = fileBuffer.toString('base64');
  const payload = {
    model: MODEL_NAME,
    input: [
      {
        role: 'system',
        content: buildPrompt(metadata),
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: metadata.mealName || 'Meal',
          },
          {
            type: 'input_image',
            image_base64: base64Image,
          },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'nutrition_schema',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            calories: { type: 'number' },
            macronutrients: {
              type: 'object',
              properties: {
                proteinGrams: { type: 'number' },
                carbsGrams: { type: 'number' },
                fatGrams: { type: 'number' },
                fiberGrams: { type: 'number' },
              },
              required: ['proteinGrams', 'carbsGrams', 'fatGrams', 'fiberGrams'],
            },
            micronutrients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  amount: { type: 'string' },
                },
                required: ['name', 'amount'],
              },
            },
            mealSummary: { type: 'string' },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['calories', 'macronutrients', 'mealSummary', 'recommendations'],
        },
      },
    },
  };

  const { data } = await axios.post(`${baseUrl}/responses`, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 60000,
  });

  const result = data?.output?.[0]?.content?.[0]?.text;
  return mapResponsePayload(result ? JSON.parse(result) : null);
};

const generateMockAnalysis = () => {
  const calories = Math.round(250 + Math.random() * 400);
  return {
    calories,
    macronutrients: {
      proteinGrams: Math.round(calories * 0.25) / 10,
      carbsGrams: Math.round(calories * 0.45) / 10,
      fatGrams: Math.round(calories * 0.3) / 10,
      fiberGrams: Math.round(5 + Math.random() * 10),
    },
    micronutrients: [
      { name: 'Vitamin C', amount: `${10 + Math.round(Math.random() * 40)} mg` },
      { name: 'Iron', amount: `${1 + Math.round(Math.random() * 3)} mg` },
    ],
    mealSummary: 'Mock analysis: replace with live AI by setting OPENAI_API_KEY.',
    recommendations: [
      'Add leafy greens for extra fiber.',
      'Pair with water to stay hydrated.',
    ],
  };
};

async function analyzeFoodPhoto(file, metadata = {}) {
  const shouldMock = process.env.USE_MOCK_AI === 'true' || !process.env.OPENAI_API_KEY;
  if (shouldMock) {
    return generateMockAnalysis();
  }

  return callOpenAiVision(file.buffer, metadata);
}

module.exports = {
  analyzeFoodPhoto,
  generateMockAnalysis,
};
