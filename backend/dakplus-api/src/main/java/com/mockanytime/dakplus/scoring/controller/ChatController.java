package com.mockanytime.dakplus.scoring.controller;

import com.mockanytime.dakplus.scoring.dto.ChatRequest;
import com.mockanytime.dakplus.scoring.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public String chat(@RequestBody ChatRequest request) {
        return chatService.getChatResponse(request.getMessage());
    }
}
