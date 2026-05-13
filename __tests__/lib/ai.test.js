/**
 * TDD Test Suite: lib/ai.js
 * Tests for: generateAIQuestions
 */

describe('generateAIQuestions', () => {
  let generateAIQuestions;

  beforeEach(async () => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-api-key';
    const mod = await import('../../lib/ai.js');
    generateAIQuestions = mod.generateAIQuestions;
  });

  test('should throw error when API key is missing', async () => {
    jest.resetModules();
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const mod = await import('../../lib/ai.js');
    await expect(mod.generateAIQuestions('Math', 'Grade 5', ['multiple_choice'], 5))
      .rejects.toThrow('API Key');
  });

  test('should call Gemini API with correct URL', async () => {
    const mockQuestions = [
      { type: 'multiple_choice', question: 'Q1?', options: ['A', 'B', 'C', 'D'], answer: 'A' },
    ];
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockQuestions) }] } }],
      }),
    });

    await generateAIQuestions('Math', 'Grade 5', ['multiple_choice'], 5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.any(Object)
    );
  });

  test('should parse and return formatted questions', async () => {
    const mockQuestions = [
      { type: 'multiple_choice', question: 'What is 2+2?', options: ['3', '4', '5', '6'], answer: '4' },
      { type: 'essay', question: 'Explain gravity', answer: 'Force of attraction' },
    ];
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockQuestions) }] } }],
      }),
    });

    const result = await generateAIQuestions('Science', 'Grade 3', ['both'], 2);
    expect(result).toHaveLength(2);
    expect(result[0].id).toMatch(/^ai-/);
    expect(result[0].options).toEqual(['3', '4', '5', '6']);
    expect(result[1].options).toEqual([]); // essay has no options
  });

  test('should throw on API error response', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Rate limited' } }),
    });

    await expect(generateAIQuestions('Math', 'Grade 5', ['multiple_choice'], 5))
      .rejects.toThrow('Rate limited');
  });

  test('should throw when no response content', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ candidates: [{ content: { parts: [{}] } }] }),
    });

    await expect(generateAIQuestions('Math', 'Grade 5', ['multiple_choice'], 5))
      .rejects.toThrow('No response content');
  });

  test('should handle format description for both formats', async () => {
    const mockQ = [{ type: 'multiple_choice', question: 'Q?', options: ['A','B','C','D'], answer: 'A' }];
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockQ) }] } }],
      }),
    });

    await generateAIQuestions('Math', 'Grade 5', ['both'], 1);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    const prompt = body.contents[0].parts[0].text;
    expect(prompt).toContain('mix of multiple choice and essay');
  });
});
