package com.mockanytime.dakplus.scoring.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "results")
public class Result {
    @Id
    private String id;
    private String testId;
    private String testTitle;
    private String userId;
    private int score;
    private int totalPoints;
    private double percentage;
    private double accuracy;
    private Map<String, String> answers; // Question Index/ID -> Answer
    private Date createdAt = new Date();

    // New fields for production
    private long timeTakenSeconds;
    private int correctAnswers;
    private int wrongAnswers;
    private Map<String, AnswerDetail> detailedAnswers = new HashMap<>();
    private Integer rank; // Leaderboard rank

    // Metadata for reporting
    private String postalCircle;
    private String division;
    private String cadre;
    private String examType;

    public Result() {
    }

    // Inner class for detailed answer breakdown
    public static class AnswerDetail {
        private String questionId;
        private String questionText;
        private String questionTextHi; // Hindi translation support
        private String questionImageUrl; // Add image support for review
        private String userAnswer;
        private String correctAnswer;
        private String explanation;
        private String explanationHi; // Hindi translation support
        private boolean isCorrect;
        private int points;

        public AnswerDetail() {
        }

        public AnswerDetail(String questionId, String questionText, String questionImageUrl, String userAnswer, String correctAnswer, String explanation,
                boolean isCorrect,
                int points) {
            this.questionId = questionId;
            this.questionText = questionText;
            this.questionImageUrl = questionImageUrl;
            this.userAnswer = userAnswer;
            this.correctAnswer = correctAnswer;
            this.explanation = explanation;
            this.isCorrect = isCorrect;
            this.points = points;
        }

        public AnswerDetail(String questionId, String questionText, String questionTextHi, String questionImageUrl, String userAnswer, String correctAnswer, String explanation, String explanationHi,
                boolean isCorrect,
                int points) {
            this.questionId = questionId;
            this.questionText = questionText;
            this.questionTextHi = questionTextHi;
            this.questionImageUrl = questionImageUrl;
            this.userAnswer = userAnswer;
            this.correctAnswer = correctAnswer;
            this.explanation = explanation;
            this.explanationHi = explanationHi;
            this.isCorrect = isCorrect;
            this.points = points;
        }

        // Getters and setters
        public String getQuestionId() {
            return questionId;
        }

        public void setQuestionId(String questionId) {
            this.questionId = questionId;
        }

        public String getQuestionText() {
            return questionText;
        }

        public void setQuestionText(String questionText) {
            this.questionText = questionText;
        }

        public String getQuestionTextHi() {
            return questionTextHi;
        }

        public void setQuestionTextHi(String questionTextHi) {
            this.questionTextHi = questionTextHi;
        }

        public String getQuestionImageUrl() {
            return questionImageUrl;
        }

        public void setQuestionImageUrl(String questionImageUrl) {
            this.questionImageUrl = questionImageUrl;
        }

        public String getUserAnswer() {
            return userAnswer;
        }

        public void setUserAnswer(String userAnswer) {
            this.userAnswer = userAnswer;
        }

        public String getCorrectAnswer() {
            return correctAnswer;
        }

        public void setCorrectAnswer(String correctAnswer) {
            this.correctAnswer = correctAnswer;
        }

        public String getExplanation() {
            return explanation;
        }

        public void setExplanation(String explanation) {
            this.explanation = explanation;
        }

        public String getExplanationHi() {
            return explanationHi;
        }

        public void setExplanationHi(String explanationHi) {
            this.explanationHi = explanationHi;
        }

        public boolean isCorrect() {
            return isCorrect;
        }

        public void setCorrect(boolean correct) {
            isCorrect = correct;
        }

        public int getPoints() {
            return points;
        }

        public void setPoints(int points) {
            this.points = points;
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTestId() {
        return testId;
    }

    public void setTestId(String testId) {
        this.testId = testId;
    }

    public String getTestTitle() {
        return testTitle;
    }

    public void setTestTitle(String testTitle) {
        this.testTitle = testTitle;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(int totalPoints) {
        this.totalPoints = totalPoints;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    public Map<String, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, String> answers) {
        this.answers = answers;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public long getTimeTakenSeconds() {
        return timeTakenSeconds;
    }

    public void setTimeTakenSeconds(long timeTakenSeconds) {
        this.timeTakenSeconds = timeTakenSeconds;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(int correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public int getWrongAnswers() {
        return wrongAnswers;
    }

    public void setWrongAnswers(int wrongAnswers) {
        this.wrongAnswers = wrongAnswers;
    }

    public Map<String, AnswerDetail> getDetailedAnswers() {
        return detailedAnswers;
    }

    public void setDetailedAnswers(Map<String, AnswerDetail> detailedAnswers) {
        this.detailedAnswers = detailedAnswers;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    public String getPostalCircle() {
        return postalCircle;
    }

    public void setPostalCircle(String postalCircle) {
        this.postalCircle = postalCircle;
    }

    public String getDivision() {
        return division;
    }

    public void setDivision(String division) {
        this.division = division;
    }

    public String getCadre() {
        return cadre;
    }

    public void setCadre(String cadre) {
        this.cadre = cadre;
    }

    public String getExamType() {
        return examType;
    }

    public void setExamType(String examType) {
        this.examType = examType;
    }
}
