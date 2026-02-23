package com.mockanytime.dakplus.assessment.repository;

import com.mockanytime.dakplus.assessment.model.Test;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TestRepository extends MongoRepository<Test, String> {
    List<Test> findByCreatedBy(String createdBy);
}
