package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.model.Question;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.parser.BeanOutputParser;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Service
public class QuestionExtractionService {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private ChatClient chatClient;

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url:}")
    private String baseUrl;

    @PostConstruct
    public void init() {
        System.out.println("=== AI SUPER DIAGNOSTICS ===");
        System.out.println("Base URL: " + baseUrl);

        // Check Environment Variables Directly
        String envGroq = System.getenv("GROQ_API_KEY");
        String envOpenAI = System.getenv("SPRING_AI_OPENAI_API_KEY");

        System.out.println("Direct Env Check:");
        System.out.println("- GROQ_API_KEY exists: " + (envGroq != null && !envGroq.isEmpty()));
        if (envGroq != null && envGroq.length() > 5) {
            System.out.println("- GROQ_API_KEY starts with 'gsk_': " + envGroq.startsWith("gsk_"));
            System.out.println(
                    "- GROQ_API_KEY starts with quote: " + (envGroq.startsWith("\"") || envGroq.startsWith("'")));
        }

        System.out.println("- SPRING_AI_OPENAI_API_KEY exists: " + (envOpenAI != null && !envOpenAI.isEmpty()));

        // Check the Resolved Spring Property
        if (apiKey == null || apiKey.isEmpty()) {
            System.err.println("CRITICAL: Resolved 'spring.ai.openai.api-key' is EMPTY!");
        } else {
            // Defensive cleanup: remove quotes or whitespace that might be in Railway
            // variables
            String cleanKey = apiKey.trim().replace("\"", "").replace("'", "");
            boolean startsWithGsk = cleanKey.startsWith("gsk_");

            String maskedKey = cleanKey.length() > 8
                    ? cleanKey.substring(0, 5) + "..." + cleanKey.substring(cleanKey.length() - 3)
                    : "***";

            System.out.println("Resolved API Key Info:");
            System.out.println("- Masked Key: " + maskedKey);
            System.out.println("- Length: " + cleanKey.length());
            System.out.println("- Valid Groq Prefix (gsk_): " + startsWithGsk);

            if (!startsWithGsk && baseUrl.contains("groq")) {
                System.err
                        .println("ALERT: You are calling Groq but the key does NOT start with 'gsk_'. This will 401.");
            }
        }
        System.out.println("============================");
    }

    public List<Question> extractQuestions(String text, String topicId, String subtopicId) {
        String promptString = """
                Extract all multiple choice questions from the provided text.
                The text may contain OCR noise or fragments labeled "[Image Text Content]:".
                Synthesize coherent questions from these fragments if they appear to belong together.

                EXTRACT BOTH ENGLISH AND HINDI TRANSLATIONS:
                - Question text in English ("text")
                - Question text in Hindi ("textHi")
                - Options in English (exactly four: a, b, c, d in "options")
                - Options in Hindi (exactly four corresponding to English in "optionsHi")
                - Correct Answer (one of the original option strings in "correctAnswer")
                - Explanation in English ("explanation")
                - Explanation in Hindi ("explanationHi")

                RULES:
                1. JSON ONLY. No explanation text outside the JSON.
                2. "correctAnswer" must match one of the "options" exactly.
                3. Clean OCR noise (random symbols, broken words).
                4. If a question is incomplete, skip it rather than guessing.
                5. Use professional Hindi terminology relevant to Indian postal exams.
                6. IMPORTANT: Extract EVERY SINGLE question found in the text. Aim for exactly 100 questions per request if available in the text. Do not stop until you have reached the end of the text. I will handle high character counts.
                7. METADATA PRESERVATION: If a question is followed by bracketed information (e.g., "(PA/SA Exam – 2020 UP – 2022 MH)"), you MUST include this text at the end of the "text" property. Do NOT strip it. It is essential for students to see the exam year and region.

                FORMAT:
                {
                  "questions": [
                    {
                      "text": "...",
                      "textHi": "...",
                      "options": ["...", "...", "...", "..."],
                      "optionsHi": ["...", "...", "...", "..."],
                      "correctAnswer": "...",
                      "explanation": "...",
                      "explanationHi": "...",
                      "type": "mcq",
                      "points": 1
                    }
                  ]
                }

                Text to analyze:
                {text}
                """;

        BeanOutputParser<QuestionList> parser = new BeanOutputParser<>(QuestionList.class);

        Prompt prompt = new Prompt(promptString.replace("{text}", text));
        long startTime = System.currentTimeMillis();
        System.out.println("Sending extraction prompt to Groq...");
        System.out.println("Text Preview (500 chars): " + (text.length() > 500 ? text.substring(0, 500) : text));
        System.out.println("Total Text Length: " + text.length());

        String response;
        try {
            response = chatClient.call(prompt).getResult().getOutput().getContent();
            System.out.println("Groq Response received in " + (System.currentTimeMillis() - startTime) + "ms");
        } catch (Exception e) {
            System.err.println("ChatClient call failed: " + e.getMessage());
            return List.of();
        }

        // Robust cleanup of response
        response = response.trim();
        System.out.println("RAW AI RESPONSE PREVIEW: " + (response.length() > 200 ? response.substring(0, 200) : response));
        
        // Remove markdown code blocks if present
        if (response.contains("```")) {
            int firstBlock = response.indexOf("```");
            int lastBlock = response.lastIndexOf("```");
            
            if (firstBlock != -1 && lastBlock != -1 && firstBlock != lastBlock) {
                // Try to extract content between backticks
                String content = response.substring(firstBlock);
                if (content.startsWith("```json")) {
                    content = content.substring(7);
                } else if (content.startsWith("```")) {
                    content = content.substring(3);
                }
                
                if (content.contains("```")) {
                    response = content.substring(0, content.lastIndexOf("```")).trim();
                } else {
                    response = content.trim();
                }
            } else if (firstBlock != -1) {
                // Only one backtick block start, strip it
                response = response.substring(firstBlock);
                if (response.startsWith("```json")) response = response.substring(7);
                else if (response.startsWith("```")) response = response.substring(3);
            }
        }
        
        response = response.trim();

        // Handle Truncation or invalid ending:
        // Case 1: Doesn't end with }
        if (!response.endsWith("}")) {
            System.out.println("Response does not end with '}'. Attempting recovery.");
            // Find last closed object
            int lastObjectEnd = response.lastIndexOf("}");
            if (lastObjectEnd != -1) {
                 // Check if we are inside a list []
                 int lastListStart = response.lastIndexOf("[");
                 int lastListEnd = response.lastIndexOf("]");
                 
                 if (lastListStart > lastListEnd) {
                     // We are inside an unfinished list
                     response = response.substring(0, response.lastIndexOf("}") + 1) + "]}";
                 } else {
                     response = response.substring(0, lastObjectEnd + 1);
                 }
            } else {
                // Extremely truncated, let's try to just close it if it has [
                if (response.contains("[") && !response.contains("]")) response += "]}";
                else if (!response.endsWith("}")) response += "}";
            }
        }

        try {
            // Using simple structure for the output parser or manual mapping if needed.
            QuestionList parsed = parser.parse(response);
            List<Question> questions = parsed.getQuestions();
            if (questions != null) {
                // Remove invalid questions (must have text, 4 options, and correct answer)
                questions.removeIf(q -> !isValidQuestion(q));

                questions.forEach(q -> {
                    q.setTopicId(topicId);
                    q.setSubtopicId(subtopicId);
                    if (q.getType() == null)
                        q.setType("mcq");
                    if (q.getPoints() == 0)
                        q.setPoints(1);
                });
                System.out.println("Successfully extracted " + questions.size() + " valid questions.");
                return questions;
            }
        } catch (Exception e) {
            System.err.println("Failed to parse AI response as JSON: " + e.getMessage());
            // Fallback: try to find a JSON array manually if parser fails
            if (response.contains("[") && response.contains("]")) {
                try {
                    System.out.println("Attempting fallback parsing for potential array.");
                    // In a real scenario, we'd use Jackson to parse this if BeanOutputParser fails
                } catch (Exception e2) {
                    System.err.println("Fallback parsing also failed.");
                }
            }
        }
        return List.of();
    }

    private boolean isValidQuestion(Question q) {
        if (q.getText() == null || q.getText().isBlank())
            return false;
        if (q.getOptions() == null || q.getOptions().size() < 4)
            return false;
        if (q.getCorrectAnswer() == null || q.getCorrectAnswer().isBlank())
            return false;

        // Ensure correct answer is one of the options
        boolean answerInOptions = q.getOptions().stream()
                .anyMatch(opt -> opt.equals(q.getCorrectAnswer()));

        if (!answerInOptions) {
            System.err.println("Validation Failed: Correct answer '" + q.getCorrectAnswer()
                    + "' not found in options for queston: " + q.getText());
        }

        return answerInOptions;
    }

    public static class QuestionList {
        private List<Question> questions;

        public List<Question> getQuestions() {
            return questions;
        }

        public void setQuestions(List<Question> questions) {
            this.questions = questions;
        }
    }
}
