package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.auth.AuthResponse;
import com.medixoffice.backend.dto.auth.LoginRequest;
import com.medixoffice.backend.dto.auth.RegisterRequest;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.DuplicateEmailException;
import com.medixoffice.backend.exception.InvalidCredentialsException;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.UserRepository;
import com.medixoffice.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new DuplicateEmailException("Email already in use");
        }

        User user = new User(request.firstName(), request.lastName(), request.email(),
                passwordEncoder.encode(request.password()), request.role());
        user = userRepository.save(user);

        return toAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Email not found"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid password");
        }

        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getRole().name());
        var summary = new AuthResponse.UserSummary(user.getId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getRole());
        return new AuthResponse(summary, token);
    }
}
