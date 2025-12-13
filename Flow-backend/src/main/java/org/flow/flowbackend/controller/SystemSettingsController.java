package org.flow.flowbackend.controller;

import org.flow.flowbackend.service.SystemSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SystemSettingsController {

    private final SystemSettingsService systemSettingsService;

    @Autowired
    public SystemSettingsController(SystemSettingsService systemSettingsService) {
        this.systemSettingsService = systemSettingsService;
    }

    @GetMapping("/limits")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN')")
    public ResponseEntity<Map<String, Integer>> getSystemLimits() {
        return ResponseEntity.ok(systemSettingsService.getSystemLimits());
    }

    @PostMapping("/limits")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> saveSystemLimits(@RequestBody Map<String, Integer> limits) {
        systemSettingsService.saveSystemLimits(limits);
        return ResponseEntity.ok(Map.of("success", true, "message", "System limits saved successfully"));
    }
}
