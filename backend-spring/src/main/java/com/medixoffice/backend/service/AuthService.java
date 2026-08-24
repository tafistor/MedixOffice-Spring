package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.auth.AuthResponse;
import com.medixoffice.backend.dto.auth.LoginRequest;
import com.medixoffice.backend.dto.auth.RegisterRequest;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.AccountDeactivatedException;
import com.medixoffice.backend.exception.AccountLockedException;
import com.medixoffice.backend.exception.DuplicateEmailException;
import com.medixoffice.backend.exception.InvalidCredentialsException;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.UserRepository;
import com.medixoffice.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

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

    
    @Transactional(noRollbackFor = {InvalidCredentialsException.class, AccountLockedException.class})
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Email not found"));

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new AccountLockedException("Too many failed login attempts. Please try again later.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                user.setLockedUntil(LocalDateTime.now().plus(LOCK_DURATION));
                throw new AccountLockedException("Too many failed login attempts. Please try again later.");
            }
            throw new InvalidCredentialsException("Invalid password");
        }

        
        if (!user.isActive()) {
            throw new AccountDeactivatedException("This account has been deactivated");
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);

        return toAuthResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getRole().name());
        var summary = new AuthResponse.UserSummary(user.getId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getRole());
        return new AuthResponse(summary, token);
    }
}
