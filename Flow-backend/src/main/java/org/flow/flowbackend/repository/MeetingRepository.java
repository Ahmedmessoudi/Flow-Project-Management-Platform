package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.Meeting;
import org.flow.flowbackend.model.Project;
import org.flow.flowbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    List<Meeting> findByRequester(User requester);
    List<Meeting> findByProject(Project project);
}
