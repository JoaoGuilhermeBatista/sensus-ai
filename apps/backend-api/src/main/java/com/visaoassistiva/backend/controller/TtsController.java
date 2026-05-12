package com.visaoassistiva.backend.controller;

import com.visaoassistiva.backend.dto.TtsRequest;
import com.visaoassistiva.backend.service.ElevenLabsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tts")
public class TtsController {

    private final ElevenLabsService elevenLabsService;

    public TtsController(ElevenLabsService elevenLabsService) {
        this.elevenLabsService = elevenLabsService;
    }

    @PostMapping
    public ResponseEntity<byte[]> getTtsAudio(@RequestBody TtsRequest request) {
        try {
            byte[] audioData = elevenLabsService.getAudio(request.getText(), request.getIsClose());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("audio/mpeg"));
            headers.setContentLength(audioData.length);
            
            return new ResponseEntity<>(audioData, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
