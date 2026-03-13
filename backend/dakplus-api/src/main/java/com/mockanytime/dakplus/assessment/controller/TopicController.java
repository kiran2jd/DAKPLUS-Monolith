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

    @PutMapping("/{id}")
    public ResponseEntity<Topic> updateTopic(@PathVariable String id, @RequestBody Topic topic) {
        topic.setId(id);
        return ResponseEntity.ok(topicService.updateTopic(topic));
    }

    @GetMapping("/")
    public List<Topic> getAllTopics(@RequestParam(required = false) String courseId) {
        if (courseId != null) {
            return topicService.getTopicsByCourse(courseId);
        }
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

    @PutMapping("/subtopics/{id}")
    public ResponseEntity<Subtopic> updateSubtopic(@PathVariable String id, @RequestBody Subtopic subtopic) {
        subtopic.setId(id);
        return ResponseEntity.ok(topicService.updateSubtopic(subtopic));
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
