package com.medixoffice.backend.dto.auth;

import com.medixoffice.backend.entity.Role;

/** Matches Node's exact response shape: { user: { id, firstName, lastName, email, role }, token }. */
public record AuthResponse(UserSummary user, String token) {

    public record UserSummary(Integer id, String firstName, String lastName, String email, Role role) {
    }
}
