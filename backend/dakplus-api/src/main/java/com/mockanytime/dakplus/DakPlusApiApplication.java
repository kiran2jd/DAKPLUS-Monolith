package com.mockanytime.dakplus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableMongoAuditing
@EnableScheduling
@org.springframework.scheduling.annotation.EnableAsync
public class DakPlusApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(DakPlusApiApplication.class, args);
    }
}
