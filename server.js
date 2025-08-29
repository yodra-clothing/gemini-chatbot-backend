    // Import necessary modules
    const express = require('express');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const cors = require('cors'); // Import the CORS middleware
    const path = require('path');

    // Initialize Express app
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Middleware
    app.use(express.json());
    app.use(cors()); // Use CORS middleware to allow cross-origin requests

    // Load API key from environment variables
    const API_KEY = process.env.GEMINI_API_KEY;

    // Check if API key is loaded
    if (!API_KEY) {
      console.error("GEMINI_API_KEY environment variable is not set.");
      process.exit(1);
    }

    // Initialize the Gemini AI model
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    // API endpoint for handling chat requests
    app.post('/api/chat', async (req, res) => {
        try {
            const { prompt } = req.body;

            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }

            // Generate content with audio
            const result = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseModalities: ["TEXT", "AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: "Puck" }
                        }
                    }
                }
            });

            // Extract text and audio data from the response
            const candidate = result.candidates?.[0];
            const text = candidate.content?.parts?.[0]?.text;
            const audioData = candidate.content?.parts?.[1]?.inlineData?.data;
            const mimeType = candidate.content?.parts?.[1]?.inlineData?.mimeType;

            if (!text || !audioData || !mimeType) {
                return res.status(500).json({ error: 'Failed to generate content or audio data' });
            }

            // Respond with the generated text and audio data
            res.json({ text, audioData, mimeType });

        } catch (error) {
            console.error('Error during AI model interaction:', error);
            res.status(500).json({ error: 'An error occurred while interacting with the AI model.', details: error.message });
        }
    });

    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });

    module.exports = app;
    
