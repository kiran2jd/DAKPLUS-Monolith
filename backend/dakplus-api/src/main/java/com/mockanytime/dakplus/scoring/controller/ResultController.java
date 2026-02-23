package com.mockanytime.dakplus.scoring.controller;

import com.mockanytime.dakplus.scoring.model.Result;
import com.mockanytime.dakplus.scoring.service.ResultService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/results")
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    record SubmitRequest(String test_id, Map<String, String> answers) {
    } // snake_case to match frontend

    @PostMapping("/submit")
    public ResponseEntity<Result> submitTest(@RequestBody SubmitRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) {
            // For dev/testing without Gateway headers
            userId = "guest";
        }
        return ResponseEntity.ok(resultService.submitTest(request.test_id(), userId, request.answers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Result> getResult(@PathVariable String id) {
        return resultService.getResult(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tests/unique-students")
    public ResponseEntity<Map<String, Long>> getUniqueStudents(
            @RequestParam("testIds") java.util.List<String> testIds) {
        long count = resultService.countUniqueStudentsForTests(testIds);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Iterable<Result>> getResultsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(resultService.getResultsByUserId(userId));
    }

    @GetMapping("/check-submission")
    public ResponseEntity<Map<String, Boolean>> checkSubmission(
            @RequestParam String userId,
            @RequestParam String testId) {
        boolean submitted = resultService.hasSubmitted(userId, testId);
        return ResponseEntity.ok(Map.of("submitted", submitted));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<Iterable<ResultService.LeaderboardEntry>> getLeaderboard(
            @RequestParam(value = "period", defaultValue = "weekly") String period) {
        return ResponseEntity.ok(resultService.getLeaderboard(period));
    }

    @GetMapping("/admin/summary")
    public ResponseEntity<com.mockanytime.dakplus.scoring.dto.ReportSummaryDto> getAdminSummary(
            @RequestParam(required = false) String circle,
            @RequestParam(required = false) String division,
            @RequestParam(required = false) String cadre,
            @RequestParam(required = false) String examType) {
        return ResponseEntity.ok(resultService.getSummaryReport(circle, division, cadre, examType));
    }
}
