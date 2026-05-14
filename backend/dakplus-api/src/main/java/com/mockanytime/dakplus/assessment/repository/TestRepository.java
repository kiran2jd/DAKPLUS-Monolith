package com.mockanytime.dakplus.assessment.repository;

import com.mockanytime.dakplus.assessment.dto.TestSummary;
import com.mockanytime.dakplus.assessment.model.Test;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TestRepository extends MongoRepository<Test, String> {
    List<Test> findByCreatedBy(String createdBy);
    List<TestSummary> findSummaryByCreatedBy(String createdBy);
    List<Test> findByCourseIdsContaining(String courseId);
    List<Test> findByTopicId(String topicId);
    @org.springframework.data.mongodb.repository.Query(value = "{}")
    List<TestSummary> findAllSummary();
    
    boolean existsByTitleAndTopicIdAndCreatedBy(String title, String topicId, String createdBy);
}
