import org.springframework.data.annotation.Transient;
import java.util.List;
import java.util.UUID;

public class Question {
    @Transient
    private boolean isDuplicate;
    private String id;
    private String text;
    private String textHi; // Hindi translation
    private String type; // mcq, true_false
    private List<String> options;
    private List<String> optionsHi; // Hindi translation
    private String correctAnswer;
    private String correctAnswerHi; // Hindi translation if needed, though usually same as options
    private String explanation;
    private String explanationHi; // Hindi translation
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

    public String getTextHi() {
        return textHi;
    }

    public void setTextHi(String textHi) {
        this.textHi = textHi;
    }

    public List<String> getOptionsHi() {
        return optionsHi;
    }

    public void setOptionsHi(List<String> optionsHi) {
        this.optionsHi = optionsHi;
    }

    public String getCorrectAnswerHi() {
        return correctAnswerHi;
    }

    public void setCorrectAnswerHi(String correctAnswerHi) {
        this.correctAnswerHi = correctAnswerHi;
    }

    public String getExplanationHi() {
        return explanationHi;
    }

    public void setExplanationHi(String explanationHi) {
        this.explanationHi = explanationHi;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isDuplicate() {
        return isDuplicate;
    }

    public void setDuplicate(boolean duplicate) {
        isDuplicate = duplicate;
    }
}
