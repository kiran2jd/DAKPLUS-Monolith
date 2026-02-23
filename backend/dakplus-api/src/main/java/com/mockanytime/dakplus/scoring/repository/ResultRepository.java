package com.mockanytime.dakplus.scoring.repository;

import com.mockanytime.dakplus.scoring.model.Result;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultRepository extends MongoRepository<Result, String> {
    List<Result> findByUserId(String userId);

    List<Result> findByTestId(String testId);

    List<Result> findByTestIdOrderByScoreDesc(String testId);

    List<Result> findByCreatedAtAfter(java.util.Date date);

    boolean existsByUserIdAndTestId(String userId, String testId);
}
