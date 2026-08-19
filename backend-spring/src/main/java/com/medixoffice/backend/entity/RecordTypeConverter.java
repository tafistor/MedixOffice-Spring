package com.medixoffice.backend.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RecordTypeConverter implements AttributeConverter<RecordType, String> {

    @Override
    public String convertToDatabaseColumn(RecordType attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case CONSULTATION -> "Consultation";
            case LAB_RESULT -> "Lab Result";
            case PRESCRIPTION -> "Prescription";
            case SURGERY -> "Surgery";
            case VACCINATION -> "Vaccination";
            case OTHER -> "Other";
        };
    }

    @Override
    public RecordType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "Consultation" -> RecordType.CONSULTATION;
            case "Lab Result" -> RecordType.LAB_RESULT;
            case "Prescription" -> RecordType.PRESCRIPTION;
            case "Surgery" -> RecordType.SURGERY;
            case "Vaccination" -> RecordType.VACCINATION;
            case "Other" -> RecordType.OTHER;
            default -> throw new IllegalArgumentException("Unknown record type: " + dbData);
        };
    }
}
