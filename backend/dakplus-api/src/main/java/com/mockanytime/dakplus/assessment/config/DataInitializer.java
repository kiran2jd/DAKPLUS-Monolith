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
import java.util.Arrays;
import java.util.List;

@Configuration("assessmentDataInitializer")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final TestRepository testRepository;

    @Override
    public void run(String... args) throws Exception {
        if (topicRepository.count() == 0) {
            seedPostalData();
        }
    }

    private void seedPostalData() {
        // Seed Real Postal Exam Courses as Topics (Tags)
        Topic mts = new Topic(null, "GDS to MTS", "Complete preparation for MTS examination", "mail", null, null, Arrays.asList("MTS"));
        Topic pmmg = new Topic(null, "Postman & Mail Guard", "Covers Paper 1 & 2 for PM/MG", "cube", null, null, Arrays.asList("PMMG"));
        Topic pasa = new Topic(null, "PA/SA Special", "Target oriented batch for PA/SA", "school", null, null, Arrays.asList("PASA"));

        mts = topicRepository.save(mts);
        pmmg = topicRepository.save(pmmg);
        pasa = topicRepository.save(pasa);

        // Seed Subtopics for MTS
        Subtopic poGuide1Mts = subtopicRepository
                .save(new Subtopic(null, "PO Guide Part 1", "Section 1 - Control of the Post Office", mts.getId(), null, null));
        
        // Seed Subtopics for PMMG
        Subtopic poGuide1Pm = subtopicRepository
                .save(new Subtopic(null, "PO Guide Part 1", "Detailed coverage for PM/MG", pmmg.getId(), null, null));

        // Seed Sample Shared Test (Shared between MTS and PMMG)
        Test sharedMock = new Test();
        sharedMock.setTitle("PO Guide Part 1 - Combined Quiz");
        sharedMock.setDescription("Common questions for both MTS and PM/MG exams.");
        sharedMock.setCategory("PO Guide");
        sharedMock.setDifficulty("Medium");
        sharedMock.setDurationMinutes(40);
        sharedMock.setTopicId(mts.getId()); // Primary association
        sharedMock.setCourseIds(Arrays.asList("MTS", "PMMG")); // Shared Content!
        sharedMock.setPremium(true);
        sharedMock.setQuestions(new ArrayList<>());
        testRepository.save(sharedMock);

        Test mtsOnlyMock = new Test();
        mtsOnlyMock.setTitle("MTS Model Paper 1");
        mtsOnlyMock.setDescription("Exclusive mock test for GDS to MTS.");
        mtsOnlyMock.setCategory("MTS");
        mtsOnlyMock.setDifficulty("Medium");
        mtsOnlyMock.setDurationMinutes(60);
        mtsOnlyMock.setTopicId(mts.getId());
        mtsOnlyMock.setCourseIds(Arrays.asList("MTS"));
        mtsOnlyMock.setPremium(true);
        mtsOnlyMock.setQuestions(new ArrayList<>());
        testRepository.save(mtsOnlyMock);

        Test pasaMock = new Test();
        pasaMock.setTitle("PA/SA Comprehensive Quiz");
        pasaMock.setDescription("Advanced questions for PA/SA exam.");
        pasaMock.setCategory("PA/SA");
        pasaMock.setDifficulty("Hard");
        pasaMock.setDurationMinutes(90);
        pasaMock.setTopicId(pasa.getId());
        pasaMock.setCourseIds(Arrays.asList("PASA"));
        pasaMock.setPremium(true);
        pasaMock.setQuestions(new ArrayList<>());
        testRepository.save(pasaMock);

        System.out.println(">>> Postal Exam Shared Data Seeded Successfully <<<");
    }
}
