package org.flow.flowbackend.service;

import org.flow.flowbackend.model.SystemConfig;
import org.flow.flowbackend.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class SystemSettingsService {

    private final SystemConfigRepository systemConfigRepository;

    @Autowired
    public SystemSettingsService(SystemConfigRepository systemConfigRepository) {
        this.systemConfigRepository = systemConfigRepository;
    }

    public static final String LIMIT_MAX_USERS_ORG = "limit.max_users_org"; // Though "Total Users" is read only, user might want "Max Users per Org"
    public static final String LIMIT_MAX_PROJECTS_ORG = "limit.max_projects_org";
    public static final String LIMIT_MAX_MEMBERS_PROJECT = "limit.max_members_project";
    public static final String LIMIT_MAX_TASKS_PROJECT = "limit.max_tasks_project";
    public static final String LIMIT_CATEGORY = "limits";

    public Map<String, Integer> getSystemLimits() {
        Map<String, Integer> limits = new HashMap<>();
        limits.put("maxUsersPerOrganization", getConfigInt(LIMIT_MAX_USERS_ORG, 50)); // Default 50
        limits.put("maxProjectsPerOrganization", getConfigInt(LIMIT_MAX_PROJECTS_ORG, 10)); // Default 10
        limits.put("maxMembersPerProject", getConfigInt(LIMIT_MAX_MEMBERS_PROJECT, 20)); // Default 20
        limits.put("maxTasksPerProject", getConfigInt(LIMIT_MAX_TASKS_PROJECT, 500)); // Default 500
        return limits;
    }

    @Transactional
    public void saveSystemLimits(Map<String, Integer> newLimits) {
        saveConfigInt(LIMIT_MAX_USERS_ORG, newLimits.getOrDefault("maxUsersPerOrganization", 50), "Maximum users per organization");
        saveConfigInt(LIMIT_MAX_PROJECTS_ORG, newLimits.getOrDefault("maxProjectsPerOrganization", 10), "Maximum projects per organization");
        saveConfigInt(LIMIT_MAX_MEMBERS_PROJECT, newLimits.getOrDefault("maxMembersPerProject", 20), "Maximum members per project");
        saveConfigInt(LIMIT_MAX_TASKS_PROJECT, newLimits.getOrDefault("maxTasksPerProject", 500), "Maximum tasks per project");
    }

    private int getConfigInt(String key, int defaultValue) {
        return systemConfigRepository.findByKey(key)
                .map(config -> {
                    try {
                        return Integer.parseInt(config.getValue());
                    } catch (NumberFormatException e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    private void saveConfigInt(String key, int value, String description) {
        SystemConfig config = systemConfigRepository.findByKey(key)
                .orElse(SystemConfig.builder()
                        .key(key)
                        .category(LIMIT_CATEGORY)
                        .description(description)
                        .build());
        
        config.setValue(String.valueOf(value));
        config.setUpdatedAt(OffsetDateTime.now());
        systemConfigRepository.save(config);
    }

    // Checking methods
    public int getMaxProjectsPerOrganization() {
        return getConfigInt(LIMIT_MAX_PROJECTS_ORG, 10);
    }

    public int getMaxMembersPerProject() {
        return getConfigInt(LIMIT_MAX_MEMBERS_PROJECT, 20);
    }

    public int getMaxTasksPerProject() {
        return getConfigInt(LIMIT_MAX_TASKS_PROJECT, 500);
    }
}
