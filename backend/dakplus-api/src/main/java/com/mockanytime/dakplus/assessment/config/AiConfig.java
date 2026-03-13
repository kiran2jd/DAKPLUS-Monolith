package com.mockanytime.dakplus.assessment.config;

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

    @Bean
    @Primary
    public ChatClient chatClient() {
        // Increase timeout to 2 minutes (120,000 ms)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(120_000);
        factory.setReadTimeout(120_000);

        RestClient.Builder builder = RestClient.builder()
                .requestFactory(factory);

        OpenAiApi openAiApi = new OpenAiApi(baseUrl, apiKey, builder);
        return new OpenAiChatClient(openAiApi);
    }
}
