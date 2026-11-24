package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.secretaryspecialty.CreateSecretaryResponse;
import com.medixoffice.backend.dto.secretaryspecialty.SecretaryCreateRequest;
import com.medixoffice.backend.dto.secretaryspecialty.SecretaryWithSpecialtiesResponse;
import com.medixoffice.backend.dto.secretaryspecialty.UpdateSpecialtiesRequest;
import com.medixoffice.backend.entity.Role;
import com.medixoffice.backend.entity.SecretarySpecialty;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.DuplicateEmailException;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.SecretarySpecialtyRepository;
import com.medixoffice.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SecretarySpecialtyService {

    private static final Logger log = LoggerFactory.getLogger(SecretarySpecialtyService.class);

    private final UserRepository userRepository;
    private final SecretarySpecialtyRepository secretarySpecialtyRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public SecretarySpecialtyService(UserRepository userRepository, SecretarySpecialtyRepository secretarySpecialtyRepository,
                                      PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.secretarySpecialtyRepository = secretarySpecialtyRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public CreateSecretaryResponse createSecretary(SecretaryCreateRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new DuplicateEmailException("Email already in use");
        }

        String temporaryPassword = generateTemporaryPassword();
        User user = new User(request.firstName(), request.lastName(), request.email(),
                passwordEncoder.encode(temporaryPassword), Role.secretary);
        user = userRepository.save(user);

        try {
            emailService.sendWelcomeEmail(request.email(), temporaryPassword, user.getId());
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}", request.email(), e);
        }

        return new CreateSecretaryResponse("Secrétaire créé avec succès", toResponse(user), temporaryPassword);
    }

    private String generateTemporaryPassword() {
        int randomNumber = (int) (1000 + Math.random() * 10_000_000);
        return "Secretary" + randomNumber;
    }

    @Transactional(readOnly = true)
    public List<SecretaryWithSpecialtiesResponse> getSecretaries() {
        return userRepository.findByRole(Role.secretary).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SecretaryWithSpecialtiesResponse updateSecretarySpecialties(UpdateSpecialtiesRequest request) {
        User user = userRepository.findById(request.userId())
                .filter(u -> u.getRole() == Role.secretary)
                .orElseThrow(() -> new ResourceNotFoundException("Secrétaire non trouvé"));

    
        secretarySpecialtyRepository.deleteByUserId(request.userId());
        secretarySpecialtyRepository.flush();

        if (request.specialties() != null) {
            for (String specialty : request.specialties()) {
                secretarySpecialtyRepository.save(new SecretarySpecialty(user, specialty));
            }
        }

        return toResponse(user);
    }

    public List<String> getSecretarySpecialties(Integer userId) {
        return secretarySpecialtyRepository.findByUserId(userId).stream()
                .map(SecretarySpecialty::getSpecialty)
                .toList();
    }

    private SecretaryWithSpecialtiesResponse toResponse(User user) {
        List<String> specialties = getSecretarySpecialties(user.getId());
        return new SecretaryWithSpecialtiesResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), specialties);
    }
}
