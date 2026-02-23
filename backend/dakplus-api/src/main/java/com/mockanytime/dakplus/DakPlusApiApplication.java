package com.mockanytime.dakplus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class DakPlusApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(DakPlusApiApplication.class, args);
    }
}
