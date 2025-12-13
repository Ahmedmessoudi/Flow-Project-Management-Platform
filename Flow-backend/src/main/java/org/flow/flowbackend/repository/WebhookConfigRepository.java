package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.Organization;
import org.flow.flowbackend.model.WebhookConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WebhookConfigRepository extends JpaRepository<WebhookConfig, Long> {
    Optional<WebhookConfig> findByOrganization(Organization organization);
    Optional<WebhookConfig> findByOrganizationAndIsActiveTrue(Organization organization);
    List<WebhookConfig> findByIsActiveTrue();
}
