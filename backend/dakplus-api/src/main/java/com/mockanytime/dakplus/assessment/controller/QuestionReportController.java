package com.mockanytime.dakplus.assessment.controller;

import com.mockanytime.dakplus.assessment.model.QuestionReport;
import com.mockanytime.dakplus.assessment.repository.QuestionReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class QuestionReportController {

    private final QuestionReportRepository reportRepository;

    @PostMapping("/")
    public ResponseEntity<QuestionReport> submitReport(@RequestBody QuestionReport report) {
        return ResponseEntity.ok(reportRepository.save(report));
    }

    @GetMapping("/")
    public List<QuestionReport> getAllReports() {
        return reportRepository.findAll();
    }

    @GetMapping("/test/{testId}")
    public List<QuestionReport> getReportsByTest(@PathVariable String testId) {
        return reportRepository.findByTestId(testId);
    }
}
