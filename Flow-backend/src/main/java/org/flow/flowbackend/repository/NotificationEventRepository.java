package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.NotificationEvent;
import org.flow.flowbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationEventRepository extends JpaRepository<NotificationEvent, Long> {
    List<NotificationEvent> findByUserOrderByCreatedAtDesc(User user);
    List<NotificationEvent> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    long countByUserAndIsReadFalse(User user);
}
