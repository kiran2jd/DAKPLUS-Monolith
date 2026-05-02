package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.model.Question;
import com.mockanytime.dakplus.assessment.model.Test;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.parser.BeanOutputParser;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationFeature;

@Service
public class QuestionExtractionService {

    private static final ObjectMapper mapper = new ObjectMapper()
            .configure(JsonParser.Feature.ALLOW_TRAILING_COMMA, true)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private ChatModel chatClient;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @org.springframework.beans.factory.annotation.Qualifier("groqChatClient")
    private ChatModel groqChatClient;

    @org.springframework.beans.factory.annotation.Autowired
    private com.mockanytime.dakplus.assessment.repository.TestRepository testRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private TopicService topicService;

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url:}")
    private String baseUrl;

    public com.mockanytime.dakplus.assessment.dto.TestMetadataDTO detectTestMetadata(String text) {
        if (text == null || text.isBlank()) return new com.mockanytime.dakplus.assessment.dto.TestMetadataDTO();

        List<com.mockanytime.dakplus.assessment.model.Topic> topics = topicService.getAllTopics();
        StringBuilder topicContext = new StringBuilder();
        for (com.mockanytime.dakplus.assessment.model.Topic t : topics) {
            topicContext.append("- ID: ").append(t.getId()).append(", Name: ").append(t.getName()).append("\n");
            List<com.mockanytime.dakplus.assessment.model.Subtopic> subtopics = topicService.getSubtopicsByTopic(t.getId());
            for (com.mockanytime.dakplus.assessment.model.Subtopic s : subtopics) {
                topicContext.append("  * Sub-ID: ").append(s.getId()).append(", Sub-Name: ").append(s.getName()).append("\n");
            }
        }

        String detectionPrompt = """
                You are an expert in Indian Postal Exams (MTS, GDS, Postman, PA/SA).
                Analyze the following text from an exam paper and identify:
                1. The most relevant TOPIC and SUBTOPIC from the provided list.
                2. Which courses this content belongs to (MTS, PMMG, PASA).
                
                EXISTING TOPICS & SUBTOPICS:
                {topicContext}
                
                RULES:
                - JSON ONLY.
                - If no match is found, leave the field empty.
                - "courseIds" must be a subset of ["MTS", "PMMG", "PASA"].
                
                FORMAT:
                {
                  "topicId": "...",
                  "subtopicId": "...",
                  "courseIds": ["...", "..."],
                  "confidenceScore": "high/medium/low"
                }
                
                TEXT TO ANALYZE (First 5000 chars):
                {text}
                """;

        String sampleText = text.substring(0, Math.min(text.length(), 5000));
        String finalPrompt = detectionPrompt
                .replace("{topicContext}", topicContext.toString())
                .replace("{text}", sampleText);

        try {
            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .withModel("gemini-2.0-flash")
                    .withMaxTokens(500)
                    .build();

            String response = chatClient.call(new org.springframework.ai.chat.prompt.Prompt(finalPrompt, options))
                    .getResult().getOutput().getContent();

            String cleanJson = sanitizeAndParseJson(response, false);
            return mapper.readValue(cleanJson, com.mockanytime.dakplus.assessment.dto.TestMetadataDTO.class);
        } catch (Exception e) {
            System.err.println("Metadata detection failed: " + e.getMessage());
            return new com.mockanytime.dakplus.assessment.dto.TestMetadataDTO();
        }
    }



    public List<Question> extractQuestions(String text, String topicId, String subtopicId) {
        if (text == null || text.isBlank()) return List.of();
        
        int maxChunkSize = 12000;
        List<Question> allQuestions = new java.util.ArrayList<>();
        
        System.out.println("Beginning smart-chunked extraction for text of length: " + text.length());
        
        int currentPos = 0;
        int chunkCount = 1;
        while (currentPos < text.length()) {
            int endPos = Math.min(currentPos + maxChunkSize, text.length());
            
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
            
            if (currentPos < text.length()) {
                try { Thread.sleep(5000); } catch (InterruptedException ignored) {}
            }
        }
        
        System.out.println("Total questions extracted across all smart chunks: " + allQuestions.size());
        return allQuestions;
    }

    /**
     * NEW SMART-ANCHOR EXTRACTION (Separate Flow)
     * Extremely aggressive splitting based strictly on question numbers to prevent data loss.
     */
    public List<Question> extractQuestionsSmartAnchor(String text, String topicId, String subtopicId) {
        if (text == null || text.isBlank()) return List.of();
        
        System.out.println("SMART-ANCHOR: Analyzing text structure...");
        
        // Find positions of question numbers like "1. ", "2. ", "3. "
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?m)^\\s*\\d+[:\\.\\)\\-]\\s+");
        java.util.regex.Matcher matcher = pattern.matcher(text);
        
        List<Integer> anchorPositions = new java.util.ArrayList<>();
        while (matcher.find()) {
            anchorPositions.add(matcher.start());
        }
        
        System.out.println("SMART-ANCHOR: Found " + anchorPositions.size() + " question anchors.");
        
        if (anchorPositions.isEmpty()) {
            System.out.println("SMART-ANCHOR: No anchors found. Falling back to standard flow.");
            return extractQuestions(text, topicId, subtopicId);
        }
        
        List<String> chunks = new java.util.ArrayList<>();
        int questionsPerChunk = 5; 
        
        for (int i = 0; i < anchorPositions.size(); i += questionsPerChunk) {
            int start = anchorPositions.get(i);
            int nextIdx = Math.min(i + questionsPerChunk, anchorPositions.size());
            int end = (nextIdx < anchorPositions.size()) ? anchorPositions.get(nextIdx) : text.length();
            
            chunks.add(text.substring(start, end).trim());
        }
        
        System.out.println("SMART-ANCHOR: Split into " + chunks.size() + " logical chunks.");
        
        List<Question> allQuestions = new java.util.ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            System.out.println("SMART-ANCHOR: Processing chunk " + (i + 1) + "/" + chunks.size() + "...");
            
            // For ULTRA-STABLE mode, we force Groq as the fallback model
            List<Question> chunkQs = extractQuestionsWithModel(chunks.get(i), topicId, subtopicId, "groq-fallback");
            
            if (chunkQs != null) {
                allQuestions.addAll(chunkQs);
                System.out.println("SMART-ANCHOR: Successfully extracted " + chunkQs.size() + " questions from chunk " + (i + 1));
            }
        }
        
        return allQuestions;
    }

    /**
     * Finds a natural breaking point (newline or start of a question) before the hard max limit
     */
    private int findSmartSplitPoint(String text, int start, int end) {
        // Look back up to 2000 characters for a natural break safely
        int lookback = Math.min(2000, end - start);
        String window = text.substring(end - lookback, end);
        
        // Priority 1: Question start pattern (newline + number + dot/paren/space)
        java.util.regex.Matcher questionMatcher = java.util.regex.Pattern.compile("\n\\s*\\d+[\\.\\)]\\s+").matcher(window);
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
        return extractQuestionsWithModel(text, topicId, subtopicId, "gemini-2.0-flash");
    }

    /**
     * Internal method that allows forcing a specific starting model (e.g., Gemini for stability)
     */
    private List<Question> extractQuestionsWithModel(String text, String topicId, String subtopicId, String startModel) {
        String promptString = """
                Extract all multiple choice questions from the provided text.
                ONLY EXTRACT ENGLISH CONTENT for now.
                
                RULES:
                1. JSON ONLY.
                2. "correctAnswer" must match one of the "options" exactly.
                3. MANDATORY METADATA PRESERVATION: You MUST keep any text in brackets at the end of questions (e.g., "(PA/SA Exam - 2020 UP)"). 
                   STRICT RULE: DO NOT move this text into the options. It MUST remain in "text".
                4. Extract EVERY SINGLE question in the text. Do not summarize or skip.
                5. STRICT 4-OPTION RULE: Ensure you find and extract all 4 options for every question.
                6. Output ONLY JSON. No surrounding text.
                
                FORMAT:
                {
                  "questions": [
                    {
                      "text": "English question text here... (Metadata in brackets here)",
                      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                      "correctAnswer": "Option 1",
                      "type": "mcq",
                      "points": 1
                    }
                  ]
                }

                Text to analyze:
                {text}
                """;

        Prompt prompt = new Prompt(promptString.replace("{text}", text));
        String response = null;
        int maxRetries = 5;
        int attempt = 0;
        String currentModel = startModel; 

        while (attempt < maxRetries) {
            try {
                attempt++;
                org.springframework.ai.chat.prompt.ChatOptions options;
                
                ChatModel activeClient = chatClient;
                if (currentModel.equals("groq-fallback") && groqChatClient != null) {
                    activeClient = groqChatClient;
                    options = OpenAiChatOptions.builder().withMaxTokens(8192).build();
                    System.out.println("Extraction (" + startModel + "): Using Groq (Attempt " + attempt + ")");
                } else {
                    options = OpenAiChatOptions.builder().withModel(currentModel).withMaxTokens(8192).build();
                    System.out.println("Extraction (" + startModel + "): Using model " + currentModel + " (Attempt " + attempt + ")");
                }

                response = activeClient.call(new Prompt(prompt.getContents(), options))
                        .getResult().getOutput().getContent();
                break;
            } catch (Exception e) {
                String fullError = e.toString().toLowerCase();
                String errorMsg = e.getMessage() != null ? e.getMessage() : "Unknown Error";
                System.err.println("Extraction attempt " + attempt + " failed: " + errorMsg);
                
                // Fallback Sequence
                boolean isGatewayError = fullError.contains("text/html") || fullError.contains("content type [text/html]") || fullError.contains("502");
                boolean isRateLimit = fullError.contains("rate_limit_exceeded") || fullError.contains("429") || fullError.contains("overloaded");
                
                if (isGatewayError || isRateLimit) {
                    if (currentModel.equals("gemini-2.0-flash") && groqChatClient != null) {
                        currentModel = "groq-fallback";
                        attempt = 0;
                        continue;
                    }
                }

                if (attempt >= maxRetries) return List.of();
                try { Thread.sleep(5000 * attempt); } catch (InterruptedException ignored) {}
            }
        }

        if (response == null) return List.of();

        try {
            String sanitizedJson = sanitizeAndParseJson(response, true);
            QuestionList parsed = mapper.readValue(sanitizedJson, QuestionList.class);
            List<Question> questions = parsed.getQuestions();
            if (questions != null) {
                questions.forEach(q -> {
                    q.setTopicId(topicId);
                    q.setSubtopicId(subtopicId);
                    if (q.getType() == null) q.setType("mcq");
                    if (q.getPoints() == 0) q.setPoints(1);
                    // Ensure empty fields for enrichment later
                    if (q.getTextHi() == null) q.setTextHi("");
                    if (q.getOptionsHi() == null) q.setOptionsHi(new ArrayList<>(List.of("", "", "", "")));
                    if (q.getExplanation() == null) q.setExplanation("");
                    if (q.getExplanationHi() == null) q.setExplanationHi("");
                });
                return questions;
            }
        } catch (Exception e) {
            System.err.println("Extraction parsing failed: " + e.getMessage());
        }
        return List.of();
    }

    /**
     * Cleans up LLM response, handles markdown blocks, trailing commas, and truncated JSON.
     */
    private String sanitizeAndParseJson(String response, boolean isList) {
        if (response == null || response.isBlank()) return isList ? "{\"questions\":[]}" : "{}";
        
        response = response.trim();
        
        // 1. Remove Markdown code blocks
        if (response.contains("```")) {
            // Find the first occurrence of { or [
            int firstBrace = response.indexOf("{");
            int firstBracket = response.indexOf("[");
            int start = -1;
            
            if (firstBrace != -1 && (firstBracket == -1 || firstBrace < firstBracket)) start = firstBrace;
            else if (firstBracket != -1) start = firstBracket;
            
            if (start != -1) {
                // Find the last occurrence of } or ]
                int lastBrace = response.lastIndexOf("}");
                int lastBracket = response.lastIndexOf("]");
                int end = Math.max(lastBrace, lastBracket);
                
                if (end > start) {
                    response = response.substring(start, end + 1);
                }
            }
        }
        
        // 2. Recovery for truncated JSON
        response = response.trim();
        if (!response.endsWith("}") && !response.endsWith("]")) {
            System.out.println("Applying truncated JSON recovery logic...");
            int lastClosingBrace = response.lastIndexOf("}");
            if (lastClosingBrace != -1) {
                response = response.substring(0, lastClosingBrace + 1);
                if (isList && !response.endsWith("]}") && !response.endsWith("]")) {
                    response += "]}";
                }
            }
        }

        // 3. Heal common LLM formatting errors
        // Fix missing commas between fields: "key": "value" "nextKey" -> "key": "value", "nextKey"
        response = response.replaceAll("(?<=[\\\"\\d\\}\\]])\\s+\\\"", ", \"");
        
        // Fix double commas caused by the above or AI laziness
        response = response.replace(", ,", ",");
        
        // Fix missing commas between objects in array: } { -> }, {
        response = response.replace("} {", "}, {");
        response = response.replace("}{", "}, {");

        // Final cleanup of common LLM artifacts
        return response.trim();
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

        // 0. STRICT CLEANLINESS CHECK: Prevent "Question Bleeding"
        for (String opt : options) {
            if (opt == null) return false;
            String trimmedOpt = opt.trim();
            // If option contains a question number pattern (e.g., "2. " or "Q3)") 
            // and it's not at the very start of a short string, it's likely a leaked question.
            if (trimmedOpt.matches(".*\\n\\s*\\d+[\\.\\)]\\s+.*") || trimmedOpt.length() > 500) {
                System.err.println("Validation Failed: Option looks like it contains another question or is too long: " + trimmedOpt);
                return false;
            }
        }

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
            
            // Wait 5 seconds between questions to finish the bulk upload faster
            try { Thread.sleep(5000); } catch (InterruptedException ignored) {}
        }
        
        System.out.println("Background enrichment complete for test: " + testId);
    }

    /**
     * BATCH BACKGROUND STAGE: Enriches lightweight questions in groups of 5.
     * Optimized for high-volume ingestion (100+ sets).
     */
    @org.springframework.scheduling.annotation.Async
    public void enrichQuestionsInBatchesAsync(String testId, List<Question> questions) {
        System.out.println("Starting background enrichment for test: " + testId);
        
        // Always refresh test from DB to avoid stale objects
        Test currentTest = testRepository.findById(testId).orElse(null);
        if (currentTest == null) return;

        List<Question> toEnrich = currentTest.getQuestions().stream()
            .filter(q -> q.getTextHi() == null || q.getTextHi().isBlank())
            .toList();
            
        if (toEnrich.isEmpty()) {
            System.out.println("All questions already enriched for test: " + testId);
            // Ensure flag is set anyway
            currentTest.setAiEnriched(true);
            testRepository.save(currentTest);
            return;
        }

        int batchSize = 3;
        for (int i = 0; i < toEnrich.size(); i += batchSize) {
            int end = Math.min(i + batchSize, toEnrich.size());
            List<Question> batch = toEnrich.subList(i, end);
            
            System.out.println("Enriching batch " + (i/batchSize + 1) + " (" + batch.size() + " Qs) for test: " + testId + "...");
            
            enrichQuestionBatch(batch);
            
            // Re-fetch to save batch progress without overwriting other changes
            testRepository.findById(testId).ifPresent(test -> {
                for (Question batchQ : batch) {
                    for (int j = 0; j < test.getQuestions().size(); j++) {
                        if (test.getQuestions().get(j).getId().equals(batchQ.getId())) {
                            test.getQuestions().set(j, batchQ);
                            break;
                        }
                    }
                }
                test.updateCounts();
                testRepository.save(test);
            });
            
            if (end < toEnrich.size()) {
                try { Thread.sleep(8000); } catch (InterruptedException ignored) {}
            }
        }
        
        // Mark test as fully enriched at the end
        testRepository.findById(testId).ifPresent(test -> {
            test.setAiEnriched(true);
            test.updateCounts();
            testRepository.save(test);
        });
        
        System.out.println("Background enrichment finished for test: " + testId);
    }

    private void enrichQuestionBatch(List<Question> batch) {
        StringBuilder batchContent = new StringBuilder();
        for (int i = 0; i < batch.size(); i++) {
            Question q = batch.get(i);
            batchContent.append("QUESTION ").append(i + 1).append(":\n")
                .append("Text: ").append(q.getText()).append("\n")
                .append("Options: ").append(String.join(", ", q.getOptions())).append("\n")
                .append("Answer: ").append(q.getCorrectAnswer()).append("\n\n");
        }

        String batchPrompt = """
            Complete these {count} questions by adding Hindi translation and detailed explanations.
            
            CONTEXT: Indian Postal Exams (MTS, GDS, Postman, PA/SA).
            
            INPUT QUESTIONS:
            {batchContent}
            
            TASK:
            For EACH question, provide:
            1. "textHi" - High quality Hindi translation. CRITICAL: Preserve any bracketed metadata (like "(Exam Info)") at the end.
            2. "optionsHi" - Hindi translation of all 4 options.
            3. "explanation" - Concise English explanation.
            4. "explanationHi" - Hindi translation of the explanation.
            
            RULES:
            - JSON ONLY.
            - Format must be an object with a "results" array.
            - Ensure the order matches the input exactly.
            - DO NOT mix content between questions.
            - DO NOT include question numbers in the "textHi" or "optionsHi".
            
            FORMAT:
            {
              "results": [
                {
                  "textHi": "...",
                  "optionsHi": ["...", "...", "...", "..."],
                  "explanation": "...",
                  "explanationHi": "..."
                },
                ...
              ]
            }
            """;
        
        String finalPrompt = batchPrompt
                .replace("{count}", String.valueOf(batch.size()))
                .replace("{batchContent}", batchContent.toString());

        int maxRetries = 5;
        int attempt = 0;
        String response = null;
        String currentModel = "gemini-2.0-flash"; 

        while (attempt < maxRetries) {
            try {
                attempt++;
                org.springframework.ai.chat.prompt.ChatOptions options;
                
                ChatModel activeClient = chatClient;
                if (currentModel.equals("groq-fallback") && groqChatClient != null) {
                    activeClient = groqChatClient;
                    options = OpenAiChatOptions.builder().withMaxTokens(batch.size() * 1200).build();
                    System.out.println("Enrichment: Using Groq Fallback (Attempt " + attempt + ")");
                } else {
                    options = OpenAiChatOptions.builder().withModel(currentModel).withMaxTokens(batch.size() * 1200).build();
                    System.out.println("Enrichment: Using Primary Model " + currentModel + " (Attempt " + attempt + ")");
                }

                response = activeClient.call(new org.springframework.ai.chat.prompt.Prompt(finalPrompt, options))
                        .getResult().getOutput().getContent();
                break;
            } catch (Exception e) {
                String fullError = e.toString().toLowerCase();
                String errorMsg = e.getMessage() != null ? e.getMessage() : "Unknown Error";
                System.err.println("Batch enrichment attempt " + attempt + " failed: " + errorMsg);
                
                // Detection for gateway errors (text/html) or rate limits (429)
                boolean isGatewayError = fullError.contains("text/html") || fullError.contains("content type [text/html]");
                boolean isRateLimit = fullError.contains("rate_limit_exceeded") || fullError.contains("429");
                
                if ((isGatewayError || isRateLimit) && groqChatClient != null && !currentModel.equals("groq-fallback")) {
                    System.out.println("ALERT: Provider returned HTML/RateLimit. Switching to Groq Fallback...");
                    currentModel = "groq-fallback";
                    attempt = 0; // Reset attempts for the new model
                    continue;
                }

                if (attempt >= maxRetries) {
                    System.err.println("Max retries reached for batch enrichment. Skipping this batch.");
                    return;
                }
                
                try { Thread.sleep(6000 * attempt); } catch (InterruptedException ignored) {}
            }
        }

        if (response == null) return;

        try {
            String cleanJson = sanitizeAndParseJson(response, true);
            Map<String, Object> root = mapper.readValue(cleanJson, Map.class);
            List<Map<String, Object>> results = (List<Map<String, Object>>) root.get("results");
            
            if (results != null) {
                for (int i = 0; i < Math.min(batch.size(), results.size()); i++) {
                    Question q = batch.get(i);
                    Map<String, Object> res = results.get(i);
                    
                    if (res.containsKey("textHi")) q.setTextHi((String) res.get("textHi"));
                    if (res.containsKey("optionsHi")) q.setOptionsHi((List<String>) res.get("optionsHi"));
                    if (res.containsKey("explanation")) q.setExplanation((String) res.get("explanation"));
                    if (res.containsKey("explanationHi")) q.setExplanationHi((String) res.get("explanationHi"));
                }
            }
        } catch (Exception e) {
            System.err.println("Batch enrichment parsing failed: " + e.getMessage());
        }
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
            1. Provide "textHi" - High quality Hindi translation. CRITICAL: Preserve any bracketed metadata (like "(Exam Info)") at the end of "textHi". DO NOT TRIM.
            2. Provide "optionsHi" - High quality Hindi translation of all 4 options.
            3. Provide "explanation" - Concise English explanation.
            4. Provide "explanationHi" - Hindi translation of the explanation.
            
            RULES:
            - JSON ONLY.
            - Use professional Hindi terminology.
            - Ensure bracketed metadata (like exam years) from the input question is KEPT in "textHi".
            
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
        String enrichmentModel = "gemini-2.0-flash";
        String currentModel = enrichmentModel; // Fallback tracker

        while (attempt < maxRetries) {
            try {
                attempt++;
                org.springframework.ai.chat.prompt.ChatOptions options;
                
                ChatModel activeClient = chatClient;
                if (currentModel.equals("groq-fallback") && groqChatClient != null) {
                    activeClient = groqChatClient;
                    options = OpenAiChatOptions.builder().withMaxTokens(1500).build();
                    System.out.println("Using Groq for enrichment fallback...");
                } else {
                    options = OpenAiChatOptions.builder().withModel(currentModel).withMaxTokens(1500).build();
                }

                response = activeClient.call(new org.springframework.ai.chat.prompt.Prompt(finalPrompt, options))
                        .getResult().getOutput().getContent();
                break;
            } catch (Exception e) {
                String errorMsg = e.getMessage() != null ? e.getMessage() : "Unknown Error";
                System.err.println("Enrichment Groq call attempt " + attempt + " failed for question: " + errorMsg);
                
                if (attempt >= maxRetries) {
                    System.err.println("Max retries exceeded for enrichment of question: " + q.getText());
                    return;
                }

                long waitTime = 20000; // Default substantial wait for enrichment
                if (errorMsg.contains("rate_limit_exceeded") || errorMsg.contains("429")) {
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("again in ([\\d\\.]+)s").matcher(errorMsg);
                    if (m.find()) {
                        waitTime = (long) (Double.parseDouble(m.group(1)) * 1000) + 3000; // Add 3s safety buffer
                    }
                    System.out.println("Rate limit detected during enrichment. Backing off for " + waitTime + "ms...");
                    
                    if (groqChatClient != null && (currentModel == null || !currentModel.equals("groq-fallback"))) {
                        System.out.println("Switching Enrichment to Groq to bypass rate limit.");
                        currentModel = "groq-fallback";
                        waitTime = 1000;
                    }
                }

                try { Thread.sleep(waitTime); } catch (InterruptedException ignored) {}
            }
        }

        if (response == null) return;

        try {
            String cleanJson = sanitizeAndParseJson(response, false);
            java.util.Map<String, Object> map = null;
            try {
                map = mapper.readValue(cleanJson, java.util.Map.class);
            } catch (Exception je) {
                System.err.println("Jackson failed, attempting manual regex recovery for enrichment...");
                map = manuallyExtractEnrichmentData(response);
            }
            
            if (map != null) {
                if (map.containsKey("textHi")) q.setTextHi((String) map.get("textHi"));
                if (map.containsKey("optionsHi")) q.setOptionsHi((java.util.List<String>) map.get("optionsHi"));
                if (map.containsKey("explanation")) q.setExplanation((String) map.get("explanation"));
                if (map.containsKey("explanationHi")) q.setExplanationHi((String) map.get("explanationHi"));
            }
            
        } catch (Exception e) {
            System.err.println("Enrichment parsing failed for question: " + e.getMessage());
            System.err.println("Raw response was: " + response);
        }
    }

    /**
     * Emergency recovery: Extract fields using regex if JSON is totally broken
     */
    private java.util.Map<String, Object> manuallyExtractEnrichmentData(String raw) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        
        try {
            // Extract textHi
            java.util.regex.Matcher mText = java.util.regex.Pattern.compile("\"textHi\"\\s*:\\s*\"(.*?)\"(?:,|\\n|\\})", java.util.regex.Pattern.DOTALL).matcher(raw);
            if (mText.find()) map.put("textHi", mText.group(1));
            
            // Extract explanation
            java.util.regex.Matcher mExp = java.util.regex.Pattern.compile("\"explanation\"\\s*:\\s*\"(.*?)\"(?:,|\\n|\\})", java.util.regex.Pattern.DOTALL).matcher(raw);
            if (mExp.find()) map.put("explanation", mExp.group(1));
            
            // Extract explanationHi
            java.util.regex.Matcher mExpHi = java.util.regex.Pattern.compile("\"explanationHi\"\\s*:\\s*\"(.*?)\"(?:,|\\n|\\})", java.util.regex.Pattern.DOTALL).matcher(raw);
            if (mExpHi.find()) map.put("explanationHi", mExpHi.group(1));
            
            // Extract optionsHi (Simplified array extraction)
            java.util.regex.Matcher mOpt = java.util.regex.Pattern.compile("\"optionsHi\"\\s*:\\s*\\[(.*?)\\]", java.util.regex.Pattern.DOTALL).matcher(raw);
            if (mOpt.find()) {
                String optContent = mOpt.group(1);
                List<String> opts = new ArrayList<>();
                java.util.regex.Matcher mEachOpt = java.util.regex.Pattern.compile("\"(.*?)\"").matcher(optContent);
                while (mEachOpt.find()) {
                    opts.add(mEachOpt.group(1));
                }
                if (opts.size() == 4) map.put("optionsHi", opts);
            }
        } catch (Exception e) {
            System.err.println("Manual regex recovery failed: " + e.getMessage());
        }
        
        return map.isEmpty() ? null : map;
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
