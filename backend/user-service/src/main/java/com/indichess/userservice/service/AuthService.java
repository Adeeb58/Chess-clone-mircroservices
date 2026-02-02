package com.indichess.userservice.service;

import com.indichess.common.dto.AuthResponse;
import com.indichess.common.dto.LoginRequest;
import com.indichess.common.dto.RegisterRequest;
import com.indichess.common.dto.UserDTO;
import com.indichess.common.exception.UserAlreadyExistsException;
import com.indichess.userservice.model.Role;
import com.indichess.userservice.model.User;
import com.indichess.userservice.repository.RoleRepository;
import com.indichess.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("username", request.getUsername());
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("email", request.getEmail());
        }

        // Get default user role
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        // Create new user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider("LOCAL")
                .roles(Set.of(userRole))
                .enabled(true)
                .build();

        user = userRepository.save(user);

        // Generate token
        String token = jwtService.generateToken(user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .userId(user.getId())
                .message("Registration successful")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()));

            if (authentication.isAuthenticated()) {
                User user = userRepository.findByUsername(request.getUsername())
                        .orElseThrow(() -> new BadCredentialsException("User not found"));

                String token = jwtService.generateToken(user.getUsername());

                return AuthResponse.builder()
                        .token(token)
                        .username(user.getUsername())
                        .userId(user.getId())
                        .message("Login successful")
                        .build();
            }
        } catch (Exception e) {
            throw new BadCredentialsException("Invalid username or password");
        }

        throw new BadCredentialsException("Invalid username or password");
    }

    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElse(null);

        if (user == null)
            return null;

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElse(null);

        if (user == null)
            return null;

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .provider(user.getProvider())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
