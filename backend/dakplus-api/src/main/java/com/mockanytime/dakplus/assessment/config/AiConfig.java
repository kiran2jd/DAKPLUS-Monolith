package com.mockanytime.dakplus.assessment.config;

import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.anthropic.AnthropicChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.anthropic.api.AnthropicApi;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class AiConfig {

    @Value("${spring.ai.anthropic.api-key:}")
    private String anthropicApiKey;

    @Value("${spring.ai.anthropic.chat.options.model:claude-3-5-sonnet-20241022}")
    private String anthropicModel;

    @Value("${spring.ai.anthropic.chat.options.max-tokens:8192}")
    private Integer anthropicMaxTokens;

    @Bean
    @Primary
    public ChatModel chatClient() {
        AnthropicApi anthropicApi = new AnthropicApi(anthropicApiKey);
        
        AnthropicChatOptions options = AnthropicChatOptions.builder()
                .withModel(anthropicModel)
                .withMaxTokens(anthropicMaxTokens)
                .build();
                
        return new AnthropicChatModel(anthropicApi, options);
    }

    @Value("${spring.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${spring.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/openai}")
    private String geminiBaseUrl;

    @Value("${spring.ai.gemini.chat.options.model:models/gemini-1.5-flash}")
    private String geminiModel;

    @Value("${spring.ai.gemini.chat.options.max-tokens:8192}")
    private Integer geminiMaxTokens;

    @Bean(name = "geminiChatClient")
    public ChatModel geminiChatClient() {
        System.out.println("CONFIG: Initializing Gemini Client with Model: " + geminiModel + " and Base URL: " + geminiBaseUrl);
        return createOpenAiClient(geminiBaseUrl, geminiApiKey, geminiModel, geminiMaxTokens);
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
