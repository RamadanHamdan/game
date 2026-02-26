
/**
 * Service to interact with Google Gemini AI for generating quiz questions.
 * This is designed to be used client-side.
 */

export const generateAIQuestions = async (subject, grade, formats, count = 10) => {
    const finalApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!finalApiKey) {
        throw new Error("Gemini API Key is required. Please check your settings.");
    }

    const formatDescription = formats.includes('both')
        ? "a mix of multiple choice and essay"
        : formats.join(' and ');

    const systemPrompt = `
    You are an educational quiz assistant. 
    Generate ${count} questions about the subject: "${subject}" specifically for Class/Grade Level: "${grade}".
    Strictly limit questions to the field of education and academic knowledge. The difficulty and content must be appropriate for students in "${grade}".
    
    CRITICAL: YOU MUST WRITE ALL QUESTIONS, OPTIONS, AND ANSWERS IN BAHASA INDONESIA (INDONESIAN LANGUAGE).
    
    Question Formats: ${formatDescription}.
    
    Output must be a VALID JSON array of objects. Do not include markdown code blocks or any text other than the JSON.
    
    Object Structure:
    1. For Multiple Choice (multiple_choice):
       {
         "type": "multiple_choice",
         "question": "Pertanyaan dalam bahasa indonesia",
         "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
         "answer": "String eksak dari array opsi yang benar"
       }
    2. For Essay (essay):
       {
         "type": "essay",
         "question": "Pertanyaan dalam bahasa indonesia",
         "answer": "Ringkasan poin kunci dari jawaban yang diharapkan"
       }
    
    Ensure the subject matter is strictly educational.
  `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${finalApiKey}`, {
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
