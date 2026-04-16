package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.model.Question;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.parser.BeanOutputParser;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Service
public class QuestionExtractionService {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private ChatClient chatClient;

    @org.springframework.beans.factory.annotation.Autowired
    private com.mockanytime.dakplus.assessment.repository.TestRepository testRepository;

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
        if (text == null || text.isBlank()) return List.of();
        
        // Smart Batching: 1800 chars to fit within narrow 6000 TPM limits
        int maxChunkSize = 1800;
        List<Question> allQuestions = new java.util.ArrayList<>();
        
        System.out.println("Beginning smart-chunked extraction for text of length: " + text.length());
        
        int currentPos = 0;
        int chunkCount = 1;
        while (currentPos < text.length()) {
            int endPos = Math.min(currentPos + maxChunkSize, text.length());
            
            // Try to find a smart split point (newline or question number) if we aren't at the very end
            if (endPos < text.length()) {
                int smartSplit = findSmartSplitPoint(text, currentPos, endPos);
                if (smartSplit > currentPos) {
                    endPos = smartSplit;
                }
            }
            
            String chunk = text.substring(currentPos, endPos);
            System.out.println("Processing chunk " + chunkCount + " (range: " + currentPos + "-" + endPos + ", length: " + chunk.length() + ")");
            
            List<Question> chunkQuestions = extractQuestionsFromSingleChunk(chunk, topicId, subtopicId);
            if (chunkQuestions != null && !chunkQuestions.isEmpty()) {
                allQuestions.addAll(chunkQuestions);
            }
            
            currentPos = endPos;
            chunkCount++;
            
            // Pause between chunks - increased to 5s to avoid TPM limits
            if (currentPos < text.length()) {
                try { Thread.sleep(5000); } catch (InterruptedException ignored) {}
            }
        }
        
        System.out.println("Total questions extracted across all smart chunks: " + allQuestions.size());
        return allQuestions;
    }

    /**
     * Finds a natural breaking point (newline or start of a question) before the hard max limit
     */
    private int findSmartSplitPoint(String text, int start, int end) {
        // Look back up to 500 characters for a natural break
        int lookback = Math.min(500, end - start);
        String window = text.substring(end - lookback, end);
        
        // Priority 1: Question start pattern (newline + number + dot)
        java.util.regex.Matcher questionMatcher = java.util.regex.Pattern.compile("\n\\d+\\.").matcher(window);
        int lastQuestionStart = -1;
        while (questionMatcher.find()) {
            lastQuestionStart = questionMatcher.start();
        }
        if (lastQuestionStart != -1) {
            return (end - lookback) + lastQuestionStart;
        }
        
        // Priority 2: Simple newline
        int lastNewline = window.lastIndexOf("\n");
        if (lastNewline != -1) {
            return (end - lookback) + lastNewline;
        }
        
        return end; // No smart split found
    }

    private List<Question> extractQuestionsFromSingleChunk(String text, String topicId, String subtopicId) {
        String promptString = """
                Extract all multiple choice questions from the provided text.
                ONLY EXTRACT ENGLISH CONTENT for now.
                
                RULES:
                1. JSON ONLY.
                2. "correctAnswer" must match one of the "options" exactly.
                3. Clean OCR noise.
                4. "textHis", "optionsHi", "explanation", "explanationHi" should be empty strings for now.
                
                FORMAT:
                {
                  "questions": [
                    {
                      "text": "English question text here...",
                      "textHi": "",
                      "options": ["A", "B", "C", "D"],
                      "optionsHi": ["", "", "", ""],
                      "correctAnswer": "A",
                      "explanation": "",
                      "explanationHi": "",
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
        
        String response = null;
        int maxRetries = 3;
        int attempt = 0;
        String fallbackModel = "llama-3.1-8b-instant";
        String currentModel = null; // Will use default from config unless switched

        while (attempt < maxRetries) {
            try {
                attempt++;
                
                OpenAiChatOptions.Builder optionsBuilder = OpenAiChatOptions.builder()
                        .withMaxTokens(1500);
                
                if (currentModel != null) {
                    optionsBuilder.withModel(currentModel);
                    System.out.println("Using model override for attempt " + attempt + ": " + currentModel);
                }

                response = chatClient.call(new Prompt(prompt.getContents(), optionsBuilder.build()))
                        .getResult().getOutput().getContent();
                break; // Success!
            } catch (Exception e) {
                String errorMsg = e.getMessage() != null ? e.getMessage() : "Unknown Error";
                System.err.println("Groq call attempt " + attempt + " failed: " + errorMsg);

                if (attempt >= maxRetries) {
                    System.err.println("Max retries exceeded for chunk. Skipping.");
                    return List.of();
                }

                long waitTime = 3000; // Default lower wait if we are switching models
                if (errorMsg.contains("rate_limit_exceeded") || errorMsg.contains("429")) {
                    // Logic to switch models
                    if (currentModel == null || !currentModel.equals(fallbackModel)) {
                        System.out.println("Rate limit hit! Switching to fallback model: " + fallbackModel);
                        currentModel = fallbackModel;
                        waitTime = 2000; // 8B model usually has higher limits, short wait is fine
                    } else {
                        // Already using fallback but still hit limit, parse wait time
                        java.util.regex.Matcher m = java.util.regex.Pattern.compile("again in ([\\d\\.]+)s").matcher(errorMsg);
                        if (m.find()) {
                            waitTime = (long) (Double.parseDouble(m.group(1)) * 1000) + 2000;
                        } else if (errorMsg.contains("TPD")) {
                            waitTime = 30000; // TPD on 8B is high, but if hit, wait longer
                        } else {
                            waitTime = 20000;
                        }
                        System.out.println("Rate limit detected on fallback. Backing off for " + waitTime + "ms...");
                    }
                } else {
                    System.out.println("Wait 5s before retrying transient error...");
                    waitTime = 5000;
                }

                try { Thread.sleep(waitTime); } catch (InterruptedException ignored) {}
            }
        }

        // Robust cleanup of response
        response = response.trim();
        
        // Remove markdown code blocks if present
        if (response.contains("```")) {
            int firstBlock = response.indexOf("```");
            int lastBlock = response.lastIndexOf("```");
            
            if (firstBlock != -1 && lastBlock != -1 && firstBlock != lastBlock) {
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
                response = response.substring(firstBlock);
                if (response.startsWith("```json")) response = response.substring(7);
                else if (response.startsWith("```")) response = response.substring(3);
            }
        }
        
        response = response.trim();

        // Recovery for truncated JSON
        if (!response.endsWith("}")) {
            // Find the last complete question object
            int lastClosingBrace = response.lastIndexOf("}");
            if (lastClosingBrace != -1) {
                // Check if we are inside the questions array
                int lastQuestionEnd = response.lastIndexOf("},");
                if (lastQuestionEnd != -1 && lastQuestionEnd < lastClosingBrace) {
                    // Try to wrap at the last complete question
                    response = response.substring(0, lastClosingBrace + 1);
                    if (!response.endsWith("]}")) {
                        response += "]}";
                    }
                } else if (lastClosingBrace != -1) {
                    // Just close the object and array
                    response = response.substring(0, lastClosingBrace + 1);
                    if (!response.endsWith("]}")) {
                        response += "]}";
                    }
                }
            } else {
                // Absolute fallback
                if (response.contains("[") && !response.contains("]")) response += "]}";
                else if (!response.endsWith("}")) response += "}";
            }
        }

        try {
            QuestionList parsed = parser.parse(response);
            List<Question> questions = parsed.getQuestions();
            if (questions != null) {
                questions.removeIf(q -> !isValidQuestion(q));
                questions.forEach(q -> {
                    q.setTopicId(topicId);
                    q.setSubtopicId(subtopicId);
                    if (q.getType() == null) q.setType("mcq");
                    if (q.getPoints() == 0) q.setPoints(1);
                });
                return questions;
            }
        } catch (Exception e) {
            System.err.println("Failed to parse chunk JSON: " + e.getMessage());
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

        String correctAnswer = q.getCorrectAnswer().trim();
        List<String> options = q.getOptions();

        // 1. Try Exact Match (Ignored Case & Trimmed)
        for (String opt : options) {
            if (opt.trim().equalsIgnoreCase(correctAnswer)) {
                q.setCorrectAnswer(opt); // Synchronize
                return true;
            }
        }

        // 2. Try Normalized Match (Remove prefixes like a), b), (c) etc.)
        String normalizedCorrect = normalizeOption(correctAnswer);
        for (String opt : options) {
            if (normalizeOption(opt).equalsIgnoreCase(normalizedCorrect)) {
                q.setCorrectAnswer(opt); // Synchronize
                return true;
            }
        }

        // 3. Handle single lette matches (AI just says "a" or "b")
        String cleanAnswer = correctAnswer.replaceAll("[^a-dA-D]", "").toLowerCase();
        if (cleanAnswer.length() == 1 && (correctAnswer.length() <= 3)) {
            int index = cleanAnswer.charAt(0) - 'a';
            if (index >= 0 && index < options.size()) {
                q.setCorrectAnswer(options.get(index));
                return true;
            }
        }

        System.err.println("Validation Failed: Correct answer '" + q.getCorrectAnswer()
                + "' not found in options for queston: " + q.getText());

        return false;
    }

    private String normalizeOption(String opt) {
        if (opt == null) return "";
        // Remove prefixes like "a) ", "b. ", "(c) ", "[d] ", "a- " at the start
        return opt.trim()
                .replaceAll("^[a-dA-D][\\s\\.\\)\\-\\]]+", "")
                .replaceAll("^[\\(\\[][a-dA-D][\\s\\.\\)\\-\\]]+", "")
                .trim();
    }

    /**
     * BACKGROUND STAGE: Enriches lightweight questions with Hindi translation and explanations.
     * This runs in the background to avoid blocking the user and bypass rate limits by using 
     * a very slow/steady pace.
     */
    @org.springframework.scheduling.annotation.Async
    public void enrichQuestionsAsync(String testId, List<Question> questions) {
        if (questions == null || questions.isEmpty()) return;
        
        System.out.println("Starting background enrichment for " + questions.size() + " questions in test: " + testId);
        
        int count = 0;
        for (Question q : questions) {
            count++;
            // Skip if already enriched
            if (q.getTextHi() != null && !q.getTextHi().isBlank()) continue;
            
            System.out.println("Enriching question " + count + " of " + questions.size() + "...");
            
            enrichSingleQuestion(q);
            
            // Save progress every question to ensure stability
            testRepository.findById(testId).ifPresent(test -> {
                // Find and update the specific question in the test list
                for (int i = 0; i < test.getQuestions().size(); i++) {
                    if (test.getQuestions().get(i).getId().equals(q.getId())) {
                        test.getQuestions().set(i, q);
                        break;
                    }
                }
                testRepository.save(test);
            });
            
            // Wait 12-15 seconds between questions to stay far below TPD/TPM limits
            try { Thread.sleep(12000); } catch (InterruptedException ignored) {}
        }
        
        System.out.println("Background enrichment complete for test: " + testId);
    }

    private void enrichSingleQuestion(Question q) {
        String enrichPrompt = """
            Complete this question by adding Hindi translation and detailed explanation.
            
            CONTEXT: Indian Postal Exams (MTS, GDS, Postman, PA/SA).
            
            INPUT QUESTION (English):
            Question: {question}
            Options: {options}
            Correct Answer: {answer}
            
            TASK:
            1. Provide "textHi" - High quality Hindi translation of the question.
            2. Provide "optionsHi" - High quality Hindi translation of all 4 options.
            3. Provide "explanation" - Concise English explanation of WHY the answer is correct.
            4. Provide "explanationHi" - Hindi translation of the explanation.
            
            RULES:
            - JSON ONLY.
            - Use professional Hindi terminology.
            
            FORMAT:
            {
              "textHi": "...",
              "optionsHi": ["...", "...", "...", "..."],
              "explanation": "...",
              "explanationHi": "..."
            }
            """;
        
        String optionsStr = String.join(", ", q.getOptions());
        String finalPrompt = enrichPrompt
                .replace("{question}", q.getText())
                .replace("{options}", optionsStr)
                .replace("{answer}", q.getCorrectAnswer());

        int maxRetries = 2;
        int attempt = 0;
        String response = null;
        
        // Use a lightweight model for enrichment to save 70B tokens
        String enrichmentModel = "llama-3.1-8b-instant";

        while (attempt < maxRetries) {
            try {
                attempt++;
                OpenAiChatOptions options = OpenAiChatOptions.builder()
                        .withModel(enrichmentModel)
                        .withMaxTokens(1500)
                        .build();
                
                response = chatClient.call(new org.springframework.ai.chat.prompt.Prompt(finalPrompt, options))
                        .getResult().getOutput().getContent();
                break;
            } catch (Exception e) {
                if (attempt >= maxRetries) return;
                try { Thread.sleep(20000); } catch (InterruptedException ignored) {}
            }
        }

        if (response == null) return;

        try {
            // Simple manual parse to avoid overhead of BeanOutputParser for a single object
            // You can use Jackson or similar here, but for simplicity:
            String cleanJson = response.replaceAll("```json|```", "").trim();
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> map = mapper.readValue(cleanJson, java.util.Map.class);
            
            if (map.containsKey("textHi")) q.setTextHi((String) map.get("textHi"));
            if (map.containsKey("optionsHi")) q.setOptionsHi((java.util.List<String>) map.get("optionsHi"));
            if (map.containsKey("explanation")) q.setExplanation((String) map.get("explanation"));
            if (map.containsKey("explanationHi")) q.setExplanationHi((String) map.get("explanationHi"));
            
        } catch (Exception e) {
            System.err.println("Enrichment parsing failed for question: " + e.getMessage());
        }
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
