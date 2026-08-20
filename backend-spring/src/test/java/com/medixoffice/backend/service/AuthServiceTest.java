package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.auth.LoginRequest;
import com.medixoffice.backend.entity.Role;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.AccountLockedException;
import com.medixoffice.backend.exception.InvalidCredentialsException;
import com.medixoffice.backend.repository.UserRepository;
import com.medixoffice.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User("Jean", "Dupont", "jean@example.com", "hashed", Role.patient);
    }

    @Test
    void login_wrongPassword_throwsInvalidCredentials() {
        when(userRepository.findByEmail("jean@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("jean@example.com", "wrong")))
                .isInstanceOf(InvalidCredentialsException.class);
        assertThat(user.getFailedLoginAttempts()).isEqualTo(1);
    }

    @Test
    void login_fifthFailedAttempt_locksAccount() {
        user.setFailedLoginAttempts(4);
        when(userRepository.findByEmail("jean@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("jean@example.com", "wrong")))
                .isInstanceOf(AccountLockedException.class);
        assertThat(user.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(user.getLockedUntil()).isAfter(LocalDateTime.now());
    }

    @Test
    void login_accountCurrentlyLocked_rejectsEvenCorrectPassword() {
        user.setLockedUntil(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findByEmail("jean@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("jean@example.com", "whatever")))
                .isInstanceOf(AccountLockedException.class);
    }

    @Test
    void login_correctPassword_resetsFailedAttemptsAndReturnsToken() {
        user.setFailedLoginAttempts(3);
        when(userRepository.findByEmail("jean@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);
        when(jwtService.generateToken(any(), anyString())).thenReturn("a.jwt.token");

        var response = authService.login(new LoginRequest("jean@example.com", "correct"));

        assertThat(response.token()).isEqualTo("a.jwt.token");
        assertThat(user.getFailedLoginAttempts()).isZero();
        assertThat(user.getLockedUntil()).isNull();
    }
}
