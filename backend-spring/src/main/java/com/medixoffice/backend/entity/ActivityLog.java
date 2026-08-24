package com.medixoffice.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "activitylogs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer userId;

    private String userEmail;

    @Column(length = 20)
    private String role;

    @Column(nullable = false, length = 10)
    private String method;

    @Column(nullable = false)
    private String path;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected ActivityLog() {
    }

    public ActivityLog(Integer userId, String userEmail, String role, String method, String path) {
        this.userId = userId;
        this.userEmail = userEmail;
        this.role = role;
        this.method = method;
        this.path = path;
    }

    public Integer getId() {
        return id;
    }

    public Integer getUserId() {
        return userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public String getRole() {
        return role;
    }

    public String getMethod() {
        return method;
    }

    public String getPath() {
        return path;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
