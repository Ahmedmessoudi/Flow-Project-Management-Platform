package org.flow.flowbackend.controller;

import org.flow.flowbackend.model.User;
import org.flow.flowbackend.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @Autowired
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Get dashboard statistics for the current user (role-aware).
     */
    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getDashboardStats(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Map<String, Object> stats = dashboardService.getDashboardStats(user);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get recent activities for the dashboard.
     */
    @GetMapping("/activities")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getRecentActivities(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Map<String, Object>> activities = dashboardService.getRecentActivities(user);
        return ResponseEntity.ok(activities);
    }

    /**
     * Get upcoming deadlines for the dashboard.
     */
    @GetMapping("/deadlines")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getUpcomingDeadlines(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Map<String, Object>> deadlines = dashboardService.getUpcomingDeadlines(user);
        return ResponseEntity.ok(deadlines);
    }
}
