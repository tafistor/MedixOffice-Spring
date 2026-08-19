package com.medixoffice.backend.entity;

/** Backed by ConsultationTypeConverter - the DB values contain spaces/hyphens that aren't valid Java identifiers. */
public enum ConsultationType {
    REGULAR_CHECKUP,
    FOLLOW_UP,
    SPECIALIST_CONSULTATION,
    EMERGENCY
}
