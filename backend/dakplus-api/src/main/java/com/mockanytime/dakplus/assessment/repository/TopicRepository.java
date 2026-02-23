package com.mockanytime.dakplus.assessment.repository;

import com.mockanytime.dakplus.assessment.model.Topic;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TopicRepository extends MongoRepository<Topic, String> {
}
