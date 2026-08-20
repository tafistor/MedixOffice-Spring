package com.medixoffice.backend.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SoftDeleteTest {

    @Test
    void patientSoftDelete_deactivatesAndStampsDeletedAt() {
        Patient patient = new Patient(new User("Paul", "Ancien", "paul@example.com", "hashed", Role.patient),
                "+32470000013", "paul@example.com", "10 rue Neuve");

        patient.softDelete();

        assertThat(patient.isActive()).isFalse();
        assertThat(patient.getDeletedAt()).isNotNull();
    }

    @Test
    void patientRestore_reactivatesAndClearsDeletedAt() {
        Patient patient = new Patient(new User("Paul", "Ancien", "paul@example.com", "hashed", Role.patient),
                "+32470000013", "paul@example.com", "10 rue Neuve");
        patient.softDelete();

        patient.restore();

        assertThat(patient.isActive()).isTrue();
        assertThat(patient.getDeletedAt()).isNull();
    }

    @Test
    void userSoftDelete_deactivatesAndStampsDeletedAt() {
        User user = new User("Paul", "Ancien", "paul@example.com", "hashed", Role.patient);

        user.softDelete();

        assertThat(user.isActive()).isFalse();
        assertThat(user.getDeletedAt()).isNotNull();
    }
}
