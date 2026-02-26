
/**
 * Service to interact with Google Gemini AI for generating quiz questions.
 * This is designed to be used client-side.
 */

export const generateAIQuestions = async (subject, formats, count = 10, apiKey = "") => {
    // Priority: Explicit key > Session Storage > Env Variable > Global Fallback
    const finalApiKey = apiKey ||
        (typeof window !== 'undefined' ? sessionStorage.getItem('gemini_api_key') : '') ||
        process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
        'AIzaSyB6K4RZkTEtajMU1J4tpqwqEyNl_BcWfb8';

    if (!finalApiKey) {
        throw new Error("Gemini API Key is required. Please check your settings.");
    }

    const formatDescription = formats.includes('both')
        ? "a mix of multiple choice and essay"
        : formats.join(' and ');

    const systemPrompt = `
    You are an educational quiz assistant. 
    Generate ${count} questions about the subject: "${subject}".
    Strictly limit questions to the field of education and academic knowledge.
    
    Question Formats: ${formatDescription}.
    
    Output must be a VALID JSON array of objects. Do not include markdown code blocks or any text other than the JSON.
    
    Object Structure:
    1. For Multiple Choice (multiple_choice):
       {
         "type": "multiple_choice",
         "question": "The question text",
         "options": ["Option A", "Option B", "Option C", "Option D"],
         "answer": "The exact string from the options array that is correct"
       }
    2. For Essay (essay):
       {
         "type": "essay",
         "question": "The question text",
         "answer": "A summary or key points of the expected answer"
       }
    
    Ensure the subject matter is strictly educational.
  `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${finalApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: systemPrompt }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to generate questions from AI");
        }

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            throw new Error("No response content from AI");
        }

        const parsedQuestions = JSON.parse(resultText);

        // Normalize format to ensure compatibility with GameContainer
        return parsedQuestions.map((q, idx) => ({
            ...q,
            id: `ai-${Date.now()}-${idx}`,
            // GameContainer expects options for multiple choice
            options: q.type === 'multiple_choice' ? q.options : [],
        }));

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};
