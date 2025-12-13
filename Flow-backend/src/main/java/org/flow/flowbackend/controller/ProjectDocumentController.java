package org.flow.flowbackend.controller;

import org.flow.flowbackend.model.ProjectDocument;
import org.flow.flowbackend.payload.response.MessageResponse;
import org.flow.flowbackend.service.ProjectDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectDocumentController {

    private final ProjectDocumentService projectDocumentService;

    @Autowired
    public ProjectDocumentController(ProjectDocumentService projectDocumentService) {
        this.projectDocumentService = projectDocumentService;
    }

    @GetMapping("/{projectId}/documents")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('CLIENT') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<List<ProjectDocument>> getProjectDocuments(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectDocumentService.getDocumentsByProject(projectId));
    }

    @PostMapping("/{projectId}/documents")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<?> addDocument(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> request) {
        try {
            String title = request.get("title");
            String type = request.get("type");
            String dataBase64 = request.get("data"); // base64 string for blob
            String fileName = request.get("fileName");
            String contentType = request.get("contentType");
            Long size = request.get("size") != null ? Long.valueOf(request.get("size")) : null;
            
            if (title == null || type == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("Missing required fields"));
            }

            byte[] data = null;
            if (dataBase64 != null && !dataBase64.isEmpty()) {
                // data URLs like "data:...;base64,...."
                String base64 = dataBase64.contains(",") ? dataBase64.substring(dataBase64.indexOf(",") + 1) : dataBase64;
                data = java.util.Base64.getDecoder().decode(base64);
            }

            if (data == null || data.length == 0) {
                return ResponseEntity.badRequest().body(new MessageResponse("File data is required"));
            }

            ProjectDocument document = projectDocumentService.addDocument(
                projectId,
                title,
                type,
                fileName,
                contentType,
                size,
                data
            );
            return ResponseEntity.ok(document);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER')")
    public ResponseEntity<MessageResponse> deleteDocument(@PathVariable Long id) {
        projectDocumentService.deleteDocument(id);
        return ResponseEntity.ok(new MessageResponse("Document deleted successfully"));
    }

    @GetMapping("/documents/{id}/download")
    @PreAuthorize("hasAuthority('SUPER_ADMIN') or hasAuthority('ORG_ADMIN') or hasAuthority('PROJECT_MANAGER') or hasAuthority('CLIENT') or hasAuthority('TEAM_MEMBER')")
    public ResponseEntity<?> downloadDocument(@PathVariable Long id) {
        ProjectDocument doc = projectDocumentService.getDocumentById(id);
        if (doc.getData() == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Document has no data to download"));
        }

        String filename = doc.getFileName() != null ? doc.getFileName() : (doc.getTitle() != null ? doc.getTitle() : "document");
        String contentType = doc.getContentType() != null ? doc.getContentType() : "application/octet-stream";

        return ResponseEntity.ok()
                .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                .header("Content-Type", contentType)
                .header("Content-Length", String.valueOf(doc.getData().length))
                .body(new ByteArrayResource(doc.getData()));
    }
}
