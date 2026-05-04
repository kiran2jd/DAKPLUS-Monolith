package com.mockanytime.dakplus.assessment.dto;

import java.util.HashMap;
import java.util.Map;

public class DocumentExtractionResult {
    private String text;
    private Map<String, String> imageMap;

    public DocumentExtractionResult() {
        this.imageMap = new HashMap<>();
    }

    public DocumentExtractionResult(String text) {
        this.text = text;
        this.imageMap = new HashMap<>();
    }

    public DocumentExtractionResult(String text, Map<String, String> imageMap) {
        this.text = text;
        this.imageMap = imageMap;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Map<String, String> getImageMap() {
        return imageMap;
    }

    public void setImageMap(Map<String, String> imageMap) {
        this.imageMap = imageMap;
    }
}
