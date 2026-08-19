package com.medixoffice.backend.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ConsultationStatusConverter implements AttributeConverter<ConsultationStatus, String> {

    @Override
    public String convertToDatabaseColumn(ConsultationStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case SCHEDULED -> "Scheduled";
            case IN_PROGRESS -> "In Progress";
            case COMPLETED -> "Completed";
            case CANCELLED -> "Cancelled";
        };
    }

    @Override
    public ConsultationStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "Scheduled" -> ConsultationStatus.SCHEDULED;
            case "In Progress" -> ConsultationStatus.IN_PROGRESS;
            case "Completed" -> ConsultationStatus.COMPLETED;
            case "Cancelled" -> ConsultationStatus.CANCELLED;
            default -> throw new IllegalArgumentException("Unknown consultation status: " + dbData);
        };
    }
}
