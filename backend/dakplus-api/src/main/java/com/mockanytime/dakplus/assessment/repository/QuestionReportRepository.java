package com.mockanytime.dakplus.assessment.repository;

import com.mockanytime.dakplus.assessment.model.QuestionReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionReportRepository extends MongoRepository<QuestionReport, String> {
    List<QuestionReport> findByTestId(String testId);
    List<QuestionReport> findByStatus(String status);
}
