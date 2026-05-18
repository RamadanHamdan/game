
/**
 * Service to interact with Google Gemini AI for generating quiz questions.
 * This is designed to be used client-side.
 */

export const generateAIQuestions = async (subject, grade, formats, count = 10) => {
    // Menggunakan API Key yang sudah di-hardcode
    const finalApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!finalApiKey) {
        throw new Error("OpenAI API Key is required. Please check your settings.");
    }

    const formatDescription = formats.includes('both')
        ? "a mix of multiple choice and essay"
        : formats.map(f => f === 'multiple_choice' ? 'pilihan ganda' : 'esai').join(' dan ');

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
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalApiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: 'system',
                        content: 'Kamu adalah asisten pembuat soal kuis pendidikan. Selalu balas dengan JSON valid saja, tanpa markdown.'
                    },
                    {
                        role: 'user',
                        content: systemPrompt
                    }
                ],
                response_format: { type: 'json_object' }, // paksa output JSON
                temperature: 0.7,
                max_completion_tokens: 4000,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const resultText = data.choices?.[0]?.message?.content;

        if (!resultText) {
            throw new Error("No response content from AI");
        }
        console.log('[AI] Raw response:', resultText);

        const cleanedText = resultText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        let parsed;
        try {
            parsed = JSON.parse(cleanedText);
        } catch (parseErr) {
            console.error('[AI] JSON parse error, raw text:', cleanedText);
            throw new Error("Gagal parse JSON dari OpenAI: " + parseErr.message);
        }

        // Handle berbagai kemungkinan format respons
        let questionsArray;
        if (Array.isArray(parsed)) {
            // Format ideal: langsung array
            questionsArray = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
            // Format object: cari key yang isinya array
            const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
            if (arrayKey) {
                questionsArray = parsed[arrayKey];
                console.log('[AI] Found array in key:', arrayKey);
            } else {
                console.error('[AI] Unexpected format:', parsed);
                throw new Error("Format respons tidak valid dari OpenAI");
            }
        } else {
            throw new Error("Format respons tidak valid dari OpenAI");
        }

        if (questionsArray.length === 0) {
            throw new Error("OpenAI mengembalikan array kosong");
        }

        // Normalize agar kompatibel dengan GameContainer
        return questionsArray.map((q, idx) => ({
            ...q,
            id: `ai-${Date.now()}-${idx}`,
            options: q.type === 'multiple_choice' ? (q.options || []) : [],
        }));

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};
