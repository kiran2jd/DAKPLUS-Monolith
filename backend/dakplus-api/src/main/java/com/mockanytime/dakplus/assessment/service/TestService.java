package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.model.Test;
import com.mockanytime.dakplus.assessment.repository.TestRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TestService {

    private final TestRepository testRepository;

    public TestService(TestRepository testRepository) {
        this.testRepository = testRepository;
    }

    public Test createTest(Test test) {
        return testRepository.save(test);
    }

    public List<Test> getAllTests() {
        return testRepository.findAll();
    }

    public List<Test> getTestsByTeacher(String teacherId) {
        return testRepository.findByCreatedBy(teacherId);
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

        return testRepository.save(existing);
    }

    public void deleteTest(String id) {
        testRepository.deleteById(id);
    }
}
