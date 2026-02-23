package com.mockanytime.dakplus.assessment.config;

import com.mockanytime.dakplus.assessment.model.Subtopic;
import com.mockanytime.dakplus.assessment.model.Topic;
import com.mockanytime.dakplus.assessment.model.Test;
import com.mockanytime.dakplus.assessment.repository.SubtopicRepository;
import com.mockanytime.dakplus.assessment.repository.TopicRepository;
import com.mockanytime.dakplus.assessment.repository.TestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final TestRepository testRepository;

    @Override
    public void run(String... args) throws Exception {
        if (topicRepository.count() == 0) {
            seedData();
        }
    }

    private void seedData() {
        // Seed Topics
        Topic java = new Topic(null, "Java", "Fundamental concepts of Java programming", "coffee");
        Topic python = new Topic(null, "Python", "Master Python for Data Science and Web", "code");
        Topic web = new Topic(null, "Web Development", "HTML, CSS, React and Node", "layout");

        java = topicRepository.save(java);
        python = topicRepository.save(python);
        web = topicRepository.save(web);

        // Seed Subtopics
        Subtopic syntax = subtopicRepository
                .save(new Subtopic(null, "Basics & Syntax", "Variables, types, operators", java.getId()));
        Subtopic oop = subtopicRepository
                .save(new Subtopic(null, "OOP Concepts", "Classes, Interfaces, Inheritance", java.getId()));

        Subtopic django = subtopicRepository
                .save(new Subtopic(null, "Django Framework", "Backend with Python", python.getId()));
        Subtopic react = subtopicRepository
                .save(new Subtopic(null, "React Hooks", "State and Effects in React", web.getId()));

        // Seed Sample Tests
        Test javaTest = new Test();
        javaTest.setTitle("Java Core Quiz");
        javaTest.setDescription("Test your knowledge of Java fundamentals and OOP.");
        javaTest.setCategory("Programming");
        javaTest.setDifficulty("Medium");
        javaTest.setDurationMinutes(30);
        javaTest.setTopicId(java.getId());
        javaTest.setSubtopicId(oop.getId());
        javaTest.setPremium(false);
        javaTest.setQuestions(new ArrayList<>()); // Empty for now, user can add via AI

        testRepository.save(javaTest);

        Test reactTest = new Test();
        reactTest.setTitle("React Fundamentals");
        reactTest.setDescription("Modern React development with hooks.");
        reactTest.setCategory("Web Development");
        reactTest.setDifficulty("Easy");
        reactTest.setDurationMinutes(20);
        reactTest.setTopicId(web.getId());
        reactTest.setSubtopicId(react.getId());
        reactTest.setPremium(true);
        reactTest.setQuestions(new ArrayList<>());

        testRepository.save(reactTest);

        System.out.println(">>> Sample Data Seeded Successfully <<<");
    }
}
