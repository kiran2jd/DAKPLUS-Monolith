package com.mockanytime.dakplus.assessment.service;

import com.mockanytime.dakplus.assessment.model.Subtopic;
import com.mockanytime.dakplus.assessment.model.Topic;
import com.mockanytime.dakplus.assessment.repository.SubtopicRepository;
import com.mockanytime.dakplus.assessment.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;

    public Topic createTopic(Topic topic) {
        return topicRepository.save(topic);
    }

    public List<Topic> getAllTopics() {
        return topicRepository.findAll();
    }

    public Optional<Topic> getTopicById(String id) {
        return topicRepository.findById(id);
    }

    public Subtopic createSubtopic(Subtopic subtopic) {
        return subtopicRepository.save(subtopic);
    }

    public List<Subtopic> getSubtopicsByTopic(String topicId) {
        return subtopicRepository.findByTopicId(topicId);
    }

    public void deleteTopic(String id) {
        topicRepository.deleteById(id);
    }

    public void deleteSubtopic(String id) {
        subtopicRepository.deleteById(id);
    }
}
