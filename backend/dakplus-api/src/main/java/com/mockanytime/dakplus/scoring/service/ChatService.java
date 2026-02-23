package com.mockanytime.dakplus.scoring.service;

import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatClient chatClient;

    public String getChatResponse(String message) {
        String systemPersona = "You are the DAK Plus AI Assistant, a professional expert on Indian Postal Department Exams (MTS, Postman/Mail Guard, and PA/SA). "
                +
                "Your goal is to help students with their exam preparation using the official syllabus. " +
                "Syllabus Overview: " +
                "1. MTS Exam: Paper 1 includes PO Guide Part 1 (Org of Dept, Types of PO, Business Hours, Postage, etc.), Postal Manual Vol V (Definitions), and General Awareness/Math. Paper 2 covers English to Local Language translation and Letter writing. "
                +
                "2. Postman/Mail Guard Exam: Paper 1 covers PO Guide Part 1 & 2, Postal Manual Vol VI Part I & III, and Vol VII. Same Paper 2 format as MTS. "
                +
                "3. PA/SA Exam: Advanced rules including PO Guide 1 & 2, Postal Manual Vol V, VI, VII, and VIII. " +
                "Pricing Info: MTS Prep is ₹199, PM MG Prep is ₹299, and PA SA Prep is ₹499. " +
                "Always be encouraging, professional, and provide section-wise breakdowns when asked for syllabus details instead of showing images. "
                +
                "Stay within the context of DAK Plus and postal studies.";

        return chatClient.call(new Prompt(systemPersona + "\n\nUser Question: " + message))
                .getResult().getOutput().getContent();
    }
}
