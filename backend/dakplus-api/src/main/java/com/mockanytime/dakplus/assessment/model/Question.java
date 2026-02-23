package com.mockanytime.dakplus.assessment.model;

import java.util.List;
import java.util.UUID;

public class Question {
    private String id;
    private String text;
    private String textTe; // Telugu translation
    private String type; // mcq, true_false
    private List<String> options;
    private List<String> optionsTe; // Telugu translation
    private String correctAnswer;
    private String correctAnswerTe; // Telugu translation if needed, though usually same as options
    private String explanation;
    private String explanationTe; // Telugu translation
    private int points;
    private String topicId;
    private String subtopicId;
    private String imageUrl; // Base64 encoded image string for diagrams

    public Question() {
        this.id = UUID.randomUUID().toString();
    }

    public Question(String text, String type, List<String> options, String correctAnswer, String explanation,
            int points) {
        this.id = UUID.randomUUID().toString();
        this.text = text;
        this.type = type;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.points = points;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
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

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public String getTopicId() {
        return topicId;
    }

    public void setTopicId(String topicId) {
        this.topicId = topicId;
    }

    public String getSubtopicId() {
        return subtopicId;
    }

    public void setSubtopicId(String subtopicId) {
        this.subtopicId = subtopicId;
    }

    public String getTextTe() {
        return textTe;
    }

    public void setTextTe(String textTe) {
        this.textTe = textTe;
    }

    public List<String> getOptionsTe() {
        return optionsTe;
    }

    public void setOptionsTe(List<String> optionsTe) {
        this.optionsTe = optionsTe;
    }

    public String getCorrectAnswerTe() {
        return correctAnswerTe;
    }

    public void setCorrectAnswerTe(String correctAnswerTe) {
        this.correctAnswerTe = correctAnswerTe;
    }

    public String getExplanationTe() {
        return explanationTe;
    }

    public void setExplanationTe(String explanationTe) {
        this.explanationTe = explanationTe;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
