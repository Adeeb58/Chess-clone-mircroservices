package com.indichess.userservice.controller;

import com.indichess.common.dto.UserDTO;
import com.indichess.userservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HomeController {
    private final AuthService authService;

    @GetMapping("/home")
    public ResponseEntity<Map<String, Object>> home(
            @RequestHeader(value = "X-Username", required = false) String username) {
        if (username == null || username.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "authenticated", false,
                    "message", "Not authenticated"));
        }

        UserDTO user = authService.getUserByUsername(username);
        if (user == null) {
            return ResponseEntity.ok(Map.of(
                    "authenticated", false,
                    "message", "User not found"));
        }

        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "username", user.getUsername(),
                "userId", user.getId(),
                "message", "Welcome " + user.getUsername()));
    }
}
