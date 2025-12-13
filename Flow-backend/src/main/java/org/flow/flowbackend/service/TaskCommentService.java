package org.flow.flowbackend.service;

import org.flow.flowbackend.model.Task;
import org.flow.flowbackend.model.TaskComment;
import org.flow.flowbackend.model.User;
import org.flow.flowbackend.payload.response.TaskCommentDTO;
import org.flow.flowbackend.repository.TaskCommentRepository;
import org.flow.flowbackend.repository.TaskRepository;
import org.flow.flowbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Autowired
    public TaskCommentService(TaskCommentRepository taskCommentRepository,
                              TaskRepository taskRepository,
                              UserRepository userRepository) {
        this.taskCommentRepository = taskCommentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TaskCommentDTO addComment(Long taskId, Long userId, String content) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TaskComment comment = TaskComment.builder()
                .task(task)
                .user(user)
                .content(content)
                .createdAt(OffsetDateTime.now())
                .build();

        TaskComment saved = taskCommentRepository.save(comment);
        return convertToDTO(saved);
    }

    public List<TaskCommentDTO> getCommentsByTask(Long taskId) {
        return taskCommentRepository.findByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long commentId) {
        if (!taskCommentRepository.existsById(commentId)) {
            throw new RuntimeException("Comment not found");
        }
        taskCommentRepository.deleteById(commentId);
    }

    public long getCommentCount(Long taskId) {
        return taskCommentRepository.countByTaskId(taskId);
    }

    private TaskCommentDTO convertToDTO(TaskComment comment) {
        return TaskCommentDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getFirstName() + " " + comment.getUser().getLastName())
                .userEmail(comment.getUser().getEmail())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
