package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, String> {
    List<SystemConfig> findByCategory(String category);
    Optional<SystemConfig> findByKey(String key);
}
