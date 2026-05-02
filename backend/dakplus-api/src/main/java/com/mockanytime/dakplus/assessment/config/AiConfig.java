package com.mockanytime.dakplus.assessment.config;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class AiConfig {

    @Value("${spring.ai.openai.api-key:}")
    private String geminiApiKey;

    @Value("${spring.ai.openai.base-url:https://generativelanguage.googleapis.com/v1beta/openai}")
    private String geminiBaseUrl;

    @Value("${spring.ai.openai.chat.options.model:gemini-1.5-flash}")
    private String geminiModel;

    @Value("${spring.ai.openai.chat.options.max-tokens:8192}")
    private Integer geminiMaxTokens;

    @Bean
    @Primary
    public ChatModel chatClient() {
        System.out.println("CONFIG: Initializing Primary Gemini Client with Model: " + geminiModel + " and Base URL: " + geminiBaseUrl);
        return createOpenAiClient(geminiBaseUrl, geminiApiKey, geminiModel, geminiMaxTokens);
    }

    @Value("${spring.ai.groq.api-key:}")
    private String groqApiKey;

    @Value("${spring.ai.groq.base-url:https://api.groq.com/openai/v1}")
    private String groqBaseUrl;

    @Value("${spring.ai.groq.chat.options.model:llama-3.1-8b-instant}")
    private String groqModel;

    @Value("${spring.ai.groq.chat.options.max-tokens:8192}")
    private Integer groqMaxTokens;

    @Bean(name = "groqChatClient")
    public ChatModel groqChatClient() {
        System.out.println("CONFIG: Initializing Fallback Groq Client with Model: " + groqModel + " and Base URL: " + groqBaseUrl);
        return createOpenAiClient(groqBaseUrl, groqApiKey, groqModel, groqMaxTokens);
    }

    private ChatModel createOpenAiClient(String url, String key, String modelName, Integer tokens) {
        OpenAiApi openAiApi = new OpenAiApi(url, key);
        
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .withModel(modelName)
                .withMaxTokens(tokens)
                .build();
                
        return new OpenAiChatModel(openAiApi, options);
    }
}
