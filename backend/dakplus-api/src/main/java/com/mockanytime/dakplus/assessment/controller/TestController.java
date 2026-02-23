package com.mockanytime.dakplus.assessment.controller;

import com.mockanytime.dakplus.assessment.model.Question;
import com.mockanytime.dakplus.assessment.model.Test;
import com.mockanytime.dakplus.assessment.service.DocumentParsingService;
import com.mockanytime.dakplus.assessment.service.QuestionExtractionService;
import com.mockanytime.dakplus.assessment.service.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;
    private final DocumentParsingService documentParsingService;
    private final QuestionExtractionService questionExtractionService;

    @PostMapping("/")
    public ResponseEntity<Test> createTest(@RequestBody Test test,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        // In real app, trust X-User-Id from gateway or validate token
        if (userId != null) {
            test.setCreatedBy(userId);
        }
        return ResponseEntity.ok(testService.createTest(test));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Test> updateTest(@PathVariable String id, @RequestBody Test test) {
        return ResponseEntity.ok(testService.updateTest(id, test));
    }

    @GetMapping("/")
    public List<Test> getAllTests() {
        return testService.getAllTests();
    }

    @GetMapping("/available/all")
    public List<Test> getAvailableTests() {
        // Filter logic could be added here (e.g. only active tests)
        return testService.getAllTests();
    }

    @GetMapping("/my-tests")
    public List<Test> getMyTests(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null)
            return List.of();
        return testService.getTestsByTeacher(userId);
    }

    @GetMapping("/{id}")
    public Test getTest(@PathVariable String id) {
        return testService.getTestById(id).orElse(null); // Assuming getTestById returns Optional<Test>
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTest(@PathVariable String id) {
        testService.deleteTest(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/take")
    public ResponseEntity<Test> takeTest(@PathVariable String id) {
        Optional<Test> testOpt = testService.getTestById(id);
        if (testOpt.isPresent()) {
            Test test = testOpt.get();
            // Sanitize answers
            test.getQuestions().forEach(q -> q.setCorrectAnswer(null));
            return ResponseEntity.ok(test);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/extract-questions")
    public List<Question> extractQuestions(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "topicId", required = false) String topicId,
            @RequestParam(value = "subtopicId", required = false) String subtopicId) throws Exception {
        String text = documentParsingService.extractText(file);
        return questionExtractionService.extractQuestions(text, topicId, subtopicId);
    }
}
