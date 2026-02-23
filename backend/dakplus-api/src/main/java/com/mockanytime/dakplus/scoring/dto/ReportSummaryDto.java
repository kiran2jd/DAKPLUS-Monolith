package com.mockanytime.dakplus.scoring.dto;

import java.util.List;

public record ReportSummaryDto(
        long totalTests,
        double averageScore,
        double averageAccuracy,
        List<CountEntry> circleWise,
        List<CountEntry> divisionWise,
        List<CountEntry> cadreWise,
        List<CountEntry> examTypeWise) {
    public record CountEntry(String name, long count, double averageAccuracy) {
    }
}
