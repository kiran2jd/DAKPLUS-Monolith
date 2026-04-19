package com.mockanytime.dakplus.assessment.config;

import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class AiConfig {

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url}")
    private String baseUrl;

    @Value("${spring.ai.openai.chat.options.model}")
    private String model;

    @Value("${spring.ai.openai.chat.options.max-tokens:8192}")
    private Integer maxTokens;

    @Bean
    @Primary
    public ChatClient chatClient() {
        return createOpenAiClient(baseUrl, apiKey, model, maxTokens);
    }

    @Value("${spring.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${spring.ai.gemini.base-url:}")
    private String geminiBaseUrl;

    @Value("${spring.ai.gemini.chat.options.model:gemini-1.5-flash}")
    private String geminiModel;

    @Value("${spring.ai.gemini.chat.options.max-tokens:4096}")
    private Integer geminiMaxTokens;

    @Bean(name = "geminiChatClient")
    public ChatClient geminiChatClient() {
        return createOpenAiClient(geminiBaseUrl, geminiApiKey, geminiModel, geminiMaxTokens);
    }

    private ChatClient createOpenAiClient(String url, String key, String modelName, Integer tokens) {
        // Increase timeout to 2 minutes (120,000 ms)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(120_000);
        factory.setReadTimeout(120_000);

        RestClient.Builder builder = RestClient.builder()
                .requestFactory(factory);

        OpenAiApi openAiApi = new OpenAiApi(url, key, builder);
        
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .withModel(modelName)
                .withMaxTokens(tokens)
                .build();
                
        return new OpenAiChatClient(openAiApi, options);
    }
}
