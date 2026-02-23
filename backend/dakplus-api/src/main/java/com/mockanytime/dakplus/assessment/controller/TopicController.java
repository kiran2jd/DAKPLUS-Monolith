package com.mockanytime.dakplus.assessment.controller;

import com.mockanytime.dakplus.assessment.model.Subtopic;
import com.mockanytime.dakplus.assessment.model.Topic;
import com.mockanytime.dakplus.assessment.service.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @PostMapping("/")
    public ResponseEntity<Topic> createTopic(@RequestBody Topic topic) {
        return ResponseEntity.ok(topicService.createTopic(topic));
    }

    @GetMapping("/")
    public List<Topic> getAllTopics() {
        return topicService.getAllTopics();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Topic> getTopic(@PathVariable String id) {
        return topicService.getTopicById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/subtopics")
    public ResponseEntity<Subtopic> createSubtopic(@RequestBody Subtopic subtopic) {
        return ResponseEntity.ok(topicService.createSubtopic(subtopic));
    }

    @GetMapping("/{topicId}/subtopics")
    public List<Subtopic> getSubtopics(@PathVariable String topicId) {
        return topicService.getSubtopicsByTopic(topicId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTopic(@PathVariable String id) {
        topicService.deleteTopic(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/subtopics/{id}")
    public ResponseEntity<Void> deleteSubtopic(@PathVariable String id) {
        topicService.deleteSubtopic(id);
        return ResponseEntity.ok().build();
    }
}
