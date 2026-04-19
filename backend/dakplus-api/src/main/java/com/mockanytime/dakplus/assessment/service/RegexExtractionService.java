package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.model.Question;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class RegexExtractionService {

    /**
     * Parses questions from raw text using Regular Expressions.
     * This is an offline, zero-token extraction method.
     */
    public List<Question> parseQuestions(String text, String topicId, String subtopicId) {
        if (text == null || text.isBlank()) return new ArrayList<>();

        List<Question> questions = new ArrayList<>();
        
        // Step 1: Pre-process text to remove common OCR noise and headers
        String cleanText = preprocessText(text);

        // Step 2: Split text into question blocks
        // Pattern: Newline followed by number, then dot/bracket/space
        // Using lookahead to identify starts of questions
        String[] blocks = cleanText.split("(?m)^\\s*\\d+[\\.\\)]\\s+");
        
        // Find the index of original question numbers to match the blocks
        List<String> questionHeaders = new ArrayList<>();
        Matcher headerMatcher = Pattern.compile("(?m)^\\s*\\d+[\\.\\)]\\s+").matcher(cleanText);
        while (headerMatcher.find()) {
            questionHeaders.add(headerMatcher.group().trim());
        }

        // The first block before any question number is usually trash or intro
        int startIdx = (blocks.length > questionHeaders.size()) ? 1 : 0;
        
        for (int i = startIdx; i < blocks.length; i++) {
            String block = blocks[i].trim();
            if (block.isEmpty()) continue;

            Question q = parseSingleBlock(block);
            if (q != null) {
                q.setTopicId(topicId);
                q.setSubtopicId(subtopicId);
                questions.add(q);
            }
        }

        System.out.println("Regex Engine: Extracted " + questions.size() + " questions from text.");
        return questions;
    }

    private String preprocessText(String text) {
        // Remove page numbers like "Page 1 of 10" or "1 / 10" at start/end of lines
        String processed = text.replaceAll("(?m)^\\s*Page\\s*\\d+.*$", "");
        processed = processed.replaceAll("(?m)^\\s*\\d+\\s*/\\s*\\d+\\s*$", "");
        
        // Remove obvious header artifacts (Exam names repeated on every page)
        // This is tricky without knowing the exam name, but we can do some generic cleanup
        return processed;
    }

    private Question parseSingleBlock(String block) {
        // Find options: (A), (B), (C), (D) or A., B., C., D. or a., b., c., d.
        // We look for 4 options to be sure
        Pattern optionPattern = Pattern.compile("(?i)[\\(\\[]?(A|B|C|D|1|2|3|4)[\\.\\)\\-\\]]\\s*");
        Matcher matcher = optionPattern.matcher(block);
        
        List<Integer> optionPositions = new ArrayList<>();
        List<String> optionLabels = new ArrayList<>();
        
        while (matcher.find()) {
            optionPositions.add(matcher.start());
            optionLabels.add(matcher.group());
        }

        // If we didn't find at least 2 options, it might not be an MCQ
        if (optionPositions.size() < 2) {
            // Fallback for True/False
            if (block.toLowerCase().contains("true") && block.toLowerCase().contains("false")) {
                Question q = new Question();
                q.setText(block.trim());
                q.setType("mcq");
                q.setOptions(List.of("True", "False"));
                return q;
            }
            return null;
        }

        // The text before the first option is the question text
        String questionText = block.substring(0, optionPositions.get(0)).trim();
        
        // Extract options
        List<String> options = new ArrayList<>();
        for (int i = 0; i < optionPositions.size(); i++) {
            int start = optionPositions.get(i) + optionLabels.get(i).length();
            int end = (i < optionPositions.size() - 1) ? optionPositions.get(i + 1) : block.length();
            
            String optContent = block.substring(start, end).trim();
            // Remove lingering correct answer markers from OCR like "*" or "[X]"
            optContent = optContent.replaceAll("^[*\\u2713\\u2714]\\s*", ""); 
            options.add(optContent);
        }

        // --- NEW: Metadata Pull-back Logic ---
        // If the last option contains exam metadata in brackets at the end, move it to the question text
        if (!options.isEmpty()) {
            String lastOption = options.get(options.size() - 1);
            // Look for bracketed text at the very end of the last option
            Pattern metadataPattern = Pattern.compile("\\s*(\\([^\\)]+\\))\\s*$");
            Matcher metaMatcher = metadataPattern.matcher(lastOption);
            if (metaMatcher.find()) {
                String metadata = metaMatcher.group(1);
                // Remove from option
                options.set(options.size() - 1, lastOption.substring(0, metaMatcher.start()).trim());
                // Append to question
                questionText = questionText + " " + metadata;
            }
        }
        // -------------------------------------

        // Handle cases where we found more than 4 things that look like options
        // Usually we only want the first 4 for DAKPlus
        if (options.size() > 4) {
            options = options.subList(0, 4);
        } else while (options.size() < 4) {
            options.add(""); // Fill with empty if less than 4 (AI will fix in enrichment)
        }

        // Try to identify the correct answer if it's marked with a (*) or similar
        String correctAnswer = options.isEmpty() ? "" : options.get(0); // Default to first (AI will fix later)
        for (String opt : options) {
            if (opt.startsWith("*") || opt.contains("(Correct)")) {
                correctAnswer = opt.replace("*", "").replace("(Correct)", "").trim();
                break;
            }
        }

        Question q = new Question();
        q.setText(questionText.trim());
        q.setOptions(options);
        q.setCorrectAnswer(correctAnswer);
        q.setType("mcq");
        q.setPoints(1);
        
        return q;
    }
}
