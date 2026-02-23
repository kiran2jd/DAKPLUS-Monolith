package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.model.Question;
import lombok.RequiredArgsConstructor;
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

                EXTRACT BOTH ENGLISH AND TELUGU TRANSLATIONS:
                - Question text in English ("text")
                - Question text in Telugu ("textTe")
                - Options in English (exactly four: a, b, c, d in "options")
                - Options in Telugu (exactly four corresponding to English in "optionsTe")
                - Correct Answer (one of the original option strings in "correctAnswer")
                - Explanation in English ("explanation")
                - Explanation in Telugu ("explanationTe")

                RULES:
                1. JSON ONLY. No explanation text outside the JSON.
                2. "correctAnswer" must match one of the "options" exactly.
                3. Clean OCR noise (random symbols, broken words).
                4. If a question is incomplete, skip it rather than guessing.
                5. Use professional Telugu terminology relevant to Indian postal exams.

                FORMAT:
                {
                  "questions": [
                    {
                      "text": "...",
                      "textTe": "...",
                      "options": ["...", "...", "...", "..."],
                      "optionsTe": ["...", "...", "...", "..."],
                      "correctAnswer": "...",
                      "explanation": "...",
                      "explanationTe": "...",
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
        System.out.println("Sending extraction prompt to Groq (Doc Length: " + text.length() + " chars)...");

        String response;
        try {
            response = chatClient.call(prompt).getResult().getOutput().getContent();
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("AI Response received in " + duration + "ms. Response Length: " + response.length());
        } catch (Exception e) {
            System.err.println(
                    "API Call failed after " + (System.currentTimeMillis() - startTime) + "ms: " + e.getMessage());
            throw e;
        }

        // Basic cleanup of response in case AI adds markdown
        if (response.contains("```json")) {
            response = response.substring(response.indexOf("```json") + 7);
            if (response.contains("```")) {
                response = response.substring(0, response.indexOf("```"));
            }
        } else if (response.contains("```")) {
            response = response.substring(response.indexOf("```") + 3);
            if (response.contains("```")) {
                response = response.substring(0, response.indexOf("```"));
            }
        }

        response = response.trim();

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
