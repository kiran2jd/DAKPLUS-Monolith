package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.dto.TestSummary;
import com.mockanytime.dakplus.assessment.model.Test;
import com.mockanytime.dakplus.assessment.repository.TestRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Date;

@Service
public class TestService {

    private final TestRepository testRepository;

    public TestService(TestRepository testRepository) {
        this.testRepository = testRepository;
    }

    public Test createTest(Test test) {
        test.setCreatedAt(new Date());
        return testRepository.save(test);
    }

    public boolean existsByTitleAndTopicAndCreatedBy(String title, String topicId, String userId) {
        return testRepository.existsByTitleAndTopicIdAndCreatedBy(title, topicId, userId);
    }

    public List<Test> getAllTests() {
        return testRepository.findAll();
    }

    public List<Test> getTestsByCourse(String courseId) {
        return testRepository.findByCourseIdsContaining(courseId);
    }

    public List<Test> getTestsByTopic(String topicId) {
        return testRepository.findByTopicId(topicId);
    }

    public List<Test> getTestsByTeacher(String teacherId) {
        return testRepository.findByCreatedBy(teacherId);
    }

    public List<TestSummary> getTestsByTeacherSummary(String teacherId) {
        return testRepository.findSummaryByCreatedBy(teacherId);
    }

    public Optional<Test> getTestById(String id) {
        return testRepository.findById(id);
    }

    public Test updateTest(String id, Test updates) {
        Test existing = testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Test not found"));

        existing.setTitle(updates.getTitle());
        existing.setDescription(updates.getDescription());
        existing.setDurationMinutes(updates.getDurationMinutes());
        existing.setCategory(updates.getCategory());
        existing.setDifficulty(updates.getDifficulty());
        existing.setQuestions(updates.getQuestions());
        existing.setPremium(updates.isPremium());
        existing.setPrice(updates.getPrice());
        existing.setTags(updates.getTags());
        existing.setCourseIds(updates.getCourseIds());
        existing.setTopicId(updates.getTopicId());
        existing.setSubtopicId(updates.getSubtopicId());

        return testRepository.save(existing);
    }

    public void deleteTest(String id) {
        testRepository.deleteById(id);
    }

    /**
     * Checks if a question with similar text already exists in any test within the same topic.
     * Normalized for case and whitespace.
     */
    public boolean isQuestionDuplicate(String text, String topicId) {
        if (text == null || topicId == null) return false;
        
        String normalizedText = text.trim().toLowerCase().replaceAll("\\s+", " ");
        
        // Fetch all tests in this topic
        List<Test> testsInTopic = testRepository.findByTopicId(topicId);
        
        // Scan all questions in all tests for a match
        return testsInTopic.stream()
                .flatMap(test -> test.getQuestions().stream())
                .anyMatch(q -> {
                    String existingText = q.getText();
                    if (existingText == null) return false;
                    return existingText.trim().toLowerCase().replaceAll("\\s+", " ").equals(normalizedText);
                });
    }
}
