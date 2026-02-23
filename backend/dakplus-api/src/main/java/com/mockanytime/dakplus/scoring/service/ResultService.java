package com.mockanytime.dakplus.scoring.service;

import com.mockanytime.dakplus.scoring.client.AssessmentClient;
import com.mockanytime.dakplus.scoring.dto.ReportSummaryDto;
import com.mockanytime.dakplus.scoring.dto.TestDto;
import com.mockanytime.dakplus.scoring.model.Result;
import com.mockanytime.dakplus.scoring.repository.ResultRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ResultService {

    private final ResultRepository resultRepository;
    private final AssessmentClient assessmentClient;
    private final com.mockanytime.dakplus.scoring.client.AuthClient authClient;
    private final MongoTemplate mongoTemplate;

    public ResultService(ResultRepository resultRepository, AssessmentClient assessmentClient,
            com.mockanytime.dakplus.scoring.client.AuthClient authClient, MongoTemplate mongoTemplate) {
        this.resultRepository = resultRepository;
        this.assessmentClient = assessmentClient;
        this.authClient = authClient;
        this.mongoTemplate = mongoTemplate;
    }

    public Result submitTest(String testId, String userId, Map<String, String> answers) {
        return submitTest(testId, userId, answers, 0);
    }

    public Result submitTest(String testId, String userId, Map<String, String> answers, long timeTakenSeconds) {
        TestDto test = assessmentClient.getTestById(testId);

        // Fetch User profile for metadata
        com.mockanytime.dakplus.scoring.dto.UserDto user = null;
        try {
            Map<String, Object> userResponse = authClient.getUserProfile(userId);
            user = com.mockanytime.dakplus.scoring.dto.UserDto.fromResponse(userResponse);
        } catch (Exception e) {
            System.err.println("Failed to fetch user profile for metadata: " + e.getMessage());
        }

        int score = 0;
        int totalPoints = 0;
        int correctCount = 0;
        int wrongCount = 0;
        Map<String, Result.AnswerDetail> detailedAnswers = new HashMap<>();

        // Calculate scores and build detailed answer breakdown
        for (int i = 0; i < test.questions().size(); i++) {
            var q = test.questions().get(i);
            totalPoints += q.points();

            String userAnswer = answers.get(String.valueOf(i));
            String correctAnswer = q.correctAnswer();
            boolean isCorrect = userAnswer != null && correctAnswer != null &&
                    userAnswer.trim().equalsIgnoreCase(correctAnswer.trim());

            if (isCorrect) {
                score += q.points();
                correctCount++;
            } else {
                wrongCount++;
            }

            // Build detailed answer for review
            Result.AnswerDetail detail = new Result.AnswerDetail(
                    q.text(),
                    userAnswer != null ? userAnswer : "Not Answered",
                    correctAnswer,
                    q.explanation(),
                    isCorrect,
                    isCorrect ? q.points() : 0);
            detailedAnswers.put(String.valueOf(i), detail);
        }

        double percentage = totalPoints > 0 ? ((double) score / totalPoints) * 100 : 0;
        double accuracy = !test.questions().isEmpty() ? ((double) correctCount / test.questions().size()) * 100 : 0;

        Result result = new Result();
        result.setTestId(testId);
        result.setTestTitle(test.title());
        result.setUserId(userId);
        result.setScore(score);
        result.setTotalPoints(totalPoints);
        result.setPercentage(Math.round(percentage * 100.0) / 100.0);
        result.setAccuracy(Math.round(accuracy * 100.0) / 100.0);
        result.setAnswers(answers);
        result.setTimeTakenSeconds(timeTakenSeconds);
        result.setCorrectAnswers(correctCount);
        result.setWrongAnswers(wrongCount);
        result.setDetailedAnswers(detailedAnswers);

        // Set metadata from user profile
        if (user != null) {
            result.setPostalCircle(user.postalCircle());
            result.setDivision(user.division());
            result.setCadre(user.cadre());
            result.setExamType(user.examType());
        }

        Result savedResult = resultRepository.save(result);

        // Calculate rank (leaderboard position for this test)
        calculateRank(savedResult);

        // Trigger Notification
        try {
            Map<String, Object> notif = new HashMap<>();
            notif.put("userId", userId);
            notif.put("title", "Exam Completed: " + test.title());
            notif.put("message",
                    "You scored " + score + "/" + totalPoints + " (" + savedResult.getAccuracy() + "% accuracy).");
            notif.put("type", "EXAM_COMPLETION");
            notif.put("link", "/dashboard/result/" + savedResult.getId());
            authClient.createNotification(notif);
        } catch (Exception e) {
            System.err.println("Failed to trigger notification: " + e.getMessage());
        }

        return savedResult;
    }

    private void calculateRank(Result result) {
        // Get all results for this test, sorted by score descending
        java.util.List<Result> allResults = resultRepository.findByTestIdOrderByScoreDesc(result.getTestId());

        int rank = 1;
        for (Result r : allResults) {
            if (r.getId().equals(result.getId())) {
                result.setRank(rank);
                resultRepository.save(result);
                break;
            }
            rank++;
        }
    }

    public long countUniqueStudentsForTests(java.util.List<String> testIds) {
        // In a real MongoDB environment, we would use an aggregation or
        // distinct query. For simplicity with the current repository:
        Map<String, Boolean> uniqueUsers = new HashMap<>();
        for (String testId : testIds) {
            java.util.List<Result> results = resultRepository.findByTestId(testId);
            for (Result r : results) {
                uniqueUsers.put(r.getUserId(), true);
            }
        }
        return uniqueUsers.size();
    }

    public Optional<Result> getResult(String id) {
        return resultRepository.findById(id);
    }

    public Iterable<Result> getResultsByUserId(String userId) {
        return resultRepository.findByUserId(userId);
    }

    public Iterable<Result> getResultsByTestId(String testId) {
        return resultRepository.findByTestIdOrderByScoreDesc(testId);
    }

    public boolean hasSubmitted(String userId, String testId) {
        return resultRepository.existsByUserIdAndTestId(userId, testId);
    }

    public record LeaderboardEntry(
            String userId,
            String name,
            int totalScore,
            int testsTaken,
            double averageAccuracy,
            int rank) {
    }

    public List<LeaderboardEntry> getLeaderboard(String period) {
        Date startDate;
        Calendar cal = Calendar.getInstance();

        if ("weekly".equalsIgnoreCase(period)) {
            cal.add(Calendar.DAY_OF_YEAR, -7);
            startDate = cal.getTime();
        } else if ("monthly".equalsIgnoreCase(period)) {
            cal.add(Calendar.MONTH, -1);
            startDate = cal.getTime();
        } else {
            // Default to all time or specific logic
            startDate = new Date(0); // Beginning of time
        }

        List<Result> results = resultRepository.findByCreatedAtAfter(startDate);

        // Group by user
        Map<String, List<Result>> userResults = new HashMap<>();
        for (Result r : results) {
            userResults.computeIfAbsent(r.getUserId(), k -> new ArrayList<>()).add(r);
        }

        List<LeaderboardEntry> leaderboard = new ArrayList<>();

        for (Map.Entry<String, List<Result>> entry : userResults.entrySet()) {
            String userId = entry.getKey();
            List<Result> list = entry.getValue();

            int totalScore = list.stream().mapToInt(Result::getScore).sum();
            int testsTaken = list.size();
            double avgAcc = list.stream().mapToDouble(Result::getAccuracy).average().orElse(0.0);

            // In a real app, fetch user name from AuthService or User Service
            // For now, use userId or a placeholder
            String name = "User " + userId.substring(0, Math.min(userId.length(), 6));

            leaderboard.add(new LeaderboardEntry(
                    userId,
                    name,
                    totalScore,
                    testsTaken,
                    Math.round(avgAcc * 100.0) / 100.0,
                    0 // Rank set later
            ));
        }

        // Sort by total score desc
        leaderboard.sort(Comparator.comparingInt(LeaderboardEntry::totalScore).reversed());

        // Assign ranks
        List<LeaderboardEntry> rankedBoard = new ArrayList<>();
        for (int i = 0; i < leaderboard.size(); i++) {
            LeaderboardEntry e = leaderboard.get(i);
            rankedBoard.add(new LeaderboardEntry(
                    e.userId(),
                    e.name(),
                    e.totalScore(),
                    e.testsTaken(),
                    e.averageAccuracy(),
                    i + 1));
        }

        return rankedBoard;
    }

    public ReportSummaryDto getSummaryReport(String circle, String division, String cadre, String examType) {
        Criteria criteria = new Criteria();
        List<Criteria> filters = new ArrayList<>();

        if (circle != null && !circle.isEmpty())
            filters.add(Criteria.where("postalCircle").is(circle));
        if (division != null && !division.isEmpty())
            filters.add(Criteria.where("division").is(division));
        if (cadre != null && !cadre.isEmpty())
            filters.add(Criteria.where("cadre").is(cadre));
        if (examType != null && !examType.isEmpty())
            filters.add(Criteria.where("examType").is(examType));

        if (!filters.isEmpty()) {
            criteria.andOperator(filters.toArray(new Criteria[0]));
        }

        // Global stats
        Aggregation globalAgg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.group()
                        .count().as("totalTests")
                        .avg("score").as("averageScore")
                        .avg("accuracy").as("averageAccuracy"));

        @SuppressWarnings("unchecked")
        Map<String, Object> globalStats = mongoTemplate.aggregate(globalAgg, "results", Map.class)
                .getUniqueMappedResult();

        long totalTests = globalStats != null ? ((Number) globalStats.get("totalTests")).longValue() : 0;
        double avgScore = globalStats != null ? ((Number) globalStats.get("averageScore")).doubleValue() : 0.0;
        double avgAccuracy = globalStats != null ? ((Number) globalStats.get("averageAccuracy")).doubleValue() : 0.0;

        return new ReportSummaryDto(
                totalTests,
                Math.round(avgScore * 100.0) / 100.0,
                Math.round(avgAccuracy * 100.0) / 100.0,
                getGroupedStats("postalCircle", criteria),
                getGroupedStats("division", criteria),
                getGroupedStats("cadre", criteria),
                getGroupedStats("examType", criteria));
    }

    private List<ReportSummaryDto.CountEntry> getGroupedStats(String field, Criteria criteria) {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(criteria),
                Aggregation.match(Criteria.where(field).ne(null)),
                Aggregation.group(field)
                        .count().as("count")
                        .avg("accuracy").as("averageAccuracy"),
                Aggregation.project("count", "averageAccuracy").and("_id").as("name"),
                Aggregation.sort(org.springframework.data.domain.Sort.Direction.DESC, "count"),
                Aggregation.limit(10));

        AggregationResults<ReportSummaryDto.CountEntry> results = mongoTemplate.aggregate(agg, "results",
                ReportSummaryDto.CountEntry.class);

        return results.getMappedResults();
    }
}
