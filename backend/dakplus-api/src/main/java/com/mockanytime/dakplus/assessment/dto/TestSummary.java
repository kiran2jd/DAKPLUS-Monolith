package com.mockanytime.dakplus.assessment.dto;

import java.util.Date;

/**
 * A Projection interface to fetch only the necessary metadata for the 
 * Teacher Dashboard test list, reducing payload size by 95%+.
 */
public interface TestSummary {
    String getId();
    String getTitle();
    String getDescription();
    int getDurationMinutes();
    String getCategory();
    Date getCreatedAt();
    String getTopicId();
    String getSubtopicId();
    boolean isPremium();
    boolean isPublished();
}
