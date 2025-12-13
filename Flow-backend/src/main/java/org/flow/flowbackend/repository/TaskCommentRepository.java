package org.flow.flowbackend.repository;

import org.flow.flowbackend.model.Task;
import org.flow.flowbackend.model.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {
    List<TaskComment> findByTaskOrderByCreatedAtDesc(Task task);
    
    List<TaskComment> findByTaskIdOrderByCreatedAtDesc(Long taskId);
    
    long countByTask(Task task);
    
    long countByTaskId(Long taskId);
}
