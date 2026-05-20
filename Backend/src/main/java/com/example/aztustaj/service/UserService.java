package com.example.aztustaj.service;

import com.example.aztustaj.dto.UserProfileRequest;
import com.example.aztustaj.entity.User;

import java.util.List;

public interface UserService {
    User findByUsername(String username);

    List<User> findAll();

    User updateProfile(String username, UserProfileRequest profileRequest);
}