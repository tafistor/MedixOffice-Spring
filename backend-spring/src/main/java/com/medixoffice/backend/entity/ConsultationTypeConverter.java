package com.medixoffice.backend.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ConsultationTypeConverter implements AttributeConverter<ConsultationType, String> {

    @Override
    public String convertToDatabaseColumn(ConsultationType attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case REGULAR_CHECKUP -> "Regular Check-up";
            case FOLLOW_UP -> "Follow-up";
            case SPECIALIST_CONSULTATION -> "Specialist Consultation";
            case EMERGENCY -> "Emergency";
        };
    }

    @Override
    public ConsultationType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "Regular Check-up" -> ConsultationType.REGULAR_CHECKUP;
            case "Follow-up" -> ConsultationType.FOLLOW_UP;
            case "Specialist Consultation" -> ConsultationType.SPECIALIST_CONSULTATION;
            case "Emergency" -> ConsultationType.EMERGENCY;
            default -> throw new IllegalArgumentException("Unknown consultation type: " + dbData);
        };
    }
}
