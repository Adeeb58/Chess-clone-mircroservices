package com.indichess.matchservice.client;

import com.indichess.common.dto.UserDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class UserServiceClient {
    private final WebClient webClient;

    public UserServiceClient(@Value("${user-service.url}") String userServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(userServiceUrl)
                .build();
    }

    public UserDTO getUserByUsername(String username) {
        try {
            return webClient.get()
                    .uri("/users/internal/by-username/{username}", username)
                    .retrieve()
                    .bodyToMono(UserDTO.class)
                    .block();
        } catch (Exception e) {
            return null;
        }
    }

    public UserDTO getUserById(Long id) {
        try {
            return webClient.get()
                    .uri("/users/internal/by-id/{id}", id)
                    .retrieve()
                    .bodyToMono(UserDTO.class)
                    .block();
        } catch (Exception e) {
            return null;
        }
    }
}
