package com.example.aztustaj.controller;

import com.example.aztustaj.dto.UserProfileRequest;
import com.example.aztustaj.dto.UserResponse;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();

        return ResponseEntity.ok(users);
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserResponse> getByUsername(@PathVariable String username) {
        User user = userService.findByUsername(username);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(convertToResponse(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestBody UserProfileRequest profileRequest,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        User updatedUser = userService.updateProfile(user.getUsername(), profileRequest);

        return ResponseEntity.ok(convertToResponse(updatedUser));
    }

    private UserResponse convertToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getAddress()
        );
    }
}