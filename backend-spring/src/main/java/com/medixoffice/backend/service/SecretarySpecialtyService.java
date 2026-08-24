package com.medixoffice.backend.service;

import com.medixoffice.backend.dto.secretaryspecialty.SecretaryWithSpecialtiesResponse;
import com.medixoffice.backend.dto.secretaryspecialty.UpdateSpecialtiesRequest;
import com.medixoffice.backend.entity.Role;
import com.medixoffice.backend.entity.SecretarySpecialty;
import com.medixoffice.backend.entity.User;
import com.medixoffice.backend.exception.ResourceNotFoundException;
import com.medixoffice.backend.repository.SecretarySpecialtyRepository;
import com.medixoffice.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SecretarySpecialtyService {

    private final UserRepository userRepository;
    private final SecretarySpecialtyRepository secretarySpecialtyRepository;

    public SecretarySpecialtyService(UserRepository userRepository, SecretarySpecialtyRepository secretarySpecialtyRepository) {
        this.userRepository = userRepository;
        this.secretarySpecialtyRepository = secretarySpecialtyRepository;
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

        // flush() forces the deletes to actually hit the DB now. Without it, Hibernate
        // queues them as pending actions and its ActionQueue always runs inserts before
        // deletes at the next flush regardless of call order - so re-saving a specialty
        // that's already there (the common case: keeping existing ones, adding one more)
        // would insert the "new" row before the old one is gone, hitting the unique
        // constraint on (userId, specialty) even though nothing was really duplicated.
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
