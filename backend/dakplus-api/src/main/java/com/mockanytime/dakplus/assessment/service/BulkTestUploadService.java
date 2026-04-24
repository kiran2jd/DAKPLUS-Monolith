package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.model.Question;
import com.mockanytime.dakplus.assessment.model.Test;
import com.mockanytime.dakplus.assessment.dto.TestMetadataDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BulkTestUploadService {

    private final DocumentParsingService documentParsingService;
    private final QuestionExtractionService questionExtractionService;
    private final TestService testService;

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class RawFileData {
        private String filename;
        private byte[] content;
        private String contentType;
    }

    @Async
    public void processBulkUploadAsync(List<RawFileData> files, String topicId, String subtopicId, List<String> courseIds, String userId) {
        System.out.println("BULK: Received " + files.size() + " files for background processing.");
        
        int successCount = 0;
        for (int i = 0; i < files.size(); i++) {
            RawFileData fileData = files.get(i);
            String filename = fileData.getFilename();
            System.out.println("BULK: [" + (i + 1) + "/" + files.size() + "] Processing file: " + filename);
            
            try {
                // 1. Extract Text from bytes
                String text = documentParsingService.extractTextFromBytes(fileData.getContent(), filename);
                if (text == null || text.isBlank()) {
                    System.err.println("BULK: Failed to extract text from " + filename);
                    continue;
                }
                System.out.println("BULK: Extracted " + text.length() + " characters from " + filename);
                
                // 2. Detect Metadata if not provided
                String finalTopicId = topicId;
                String finalSubtopicId = subtopicId;
                List<String> finalCourseIds = courseIds;
                
                if (finalTopicId == null || finalTopicId.isBlank() || finalCourseIds == null || finalCourseIds.isEmpty()) {
                    System.out.println("BULK: Detecting metadata for " + filename + "...");
                    TestMetadataDTO detected = questionExtractionService.detectTestMetadata(text);
                    if (finalTopicId == null || finalTopicId.isBlank()) {
                        finalTopicId = detected.getTopicId();
                        finalSubtopicId = detected.getSubtopicId();
                    }
                    if (finalCourseIds == null || finalCourseIds.isEmpty()) {
                        finalCourseIds = detected.getCourseIds();
                    }
                }
                
                // 3. Extract Questions (English)
                System.out.println("BULK: Extracting English questions for " + filename + "...");
                List<Question> questions = questionExtractionService.extractQuestions(text, finalTopicId, finalSubtopicId);
                if (questions.isEmpty()) {
                    System.err.println("BULK: No questions found in " + filename);
                    continue;
                }
                
                // 4. Create Test object
                Test test = new Test();
                String title = filename;
                if (title != null) {
                    if (title.contains(".")) title = title.substring(0, title.lastIndexOf("."));
                    title = title.replace("_", " ").replace("-", " ").trim();
                    if (title.length() > 2) {
                        title = title.substring(0, 1).toUpperCase() + title.substring(1);
                    }
                }
                test.setTitle(title);
                test.setTopicId(finalTopicId);
                test.setSubtopicId(finalSubtopicId);
                test.setCourseIds(finalCourseIds);
                test.setCreatedBy(userId);
                test.setQuestions(questions);
                test.setDurationMinutes(questions.size());
                test.updateCounts();
                
                Test savedTest = testService.createTest(test);
                successCount++;
                System.out.println("BULK: Successfully created test: " + savedTest.getTitle() + " (ID: " + savedTest.getId() + ")");
                
                // 5. Trigger Background Enrichment
                System.out.println("BULK: Triggering background enrichment for " + savedTest.getTitle());
                questionExtractionService.enrichQuestionsInBatchesAsync(savedTest.getId(), savedTest.getQuestions());
                
                // Add a delay between files to avoid overwhelming the AI providers
                if (i < files.size() - 1) {
                    System.out.println("BULK: Waiting 10s before next file...");
                    try { Thread.sleep(10000); } catch (InterruptedException ignored) {}
                }
                
            } catch (Exception e) {
                System.err.println("BULK ERROR: Failed to process file " + filename + ". Error: " + e.getMessage());
                e.printStackTrace();
            }
        }
        System.out.println("BULK: Background processing complete. Successfully added " + successCount + "/" + files.size() + " tests.");
    }
}
