package com.medixoffice.backend.controller;

import com.medixoffice.backend.dto.secretaryspecialty.SecretaryWithSpecialtiesResponse;
import com.medixoffice.backend.dto.secretaryspecialty.UpdateSpecialtiesRequest;
import com.medixoffice.backend.service.SecretarySpecialtyService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/secretary-specialties")
public class SecretarySpecialtyController {

    private final SecretarySpecialtyService secretarySpecialtyService;

    public SecretarySpecialtyController(SecretarySpecialtyService secretarySpecialtyService) {
        this.secretarySpecialtyService = secretarySpecialtyService;
    }

    @GetMapping("/secretaries")
    @PreAuthorize("hasRole('admin')")
    public List<SecretaryWithSpecialtiesResponse> getSecretaries() {
        return secretarySpecialtyService.getSecretaries();
    }

    @PostMapping("/update")
    @PreAuthorize("hasRole('admin')")
    public SecretaryWithSpecialtiesResponse updateSecretarySpecialties(@Valid @RequestBody UpdateSpecialtiesRequest request) {
        return secretarySpecialtyService.updateSecretarySpecialties(request);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('admin')")
    public List<String> getSecretarySpecialties(@PathVariable Integer userId) {
        return secretarySpecialtyService.getSecretarySpecialties(userId);
    }

    @GetMapping("/current-user")
    @PreAuthorize("hasRole('secretary')")
    public List<String> getCurrentUserSpecialties(@AuthenticationPrincipal Integer userId) {
        return secretarySpecialtyService.getSecretarySpecialties(userId);
    }
}
