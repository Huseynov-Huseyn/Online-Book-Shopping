package com.example.aztustaj.service;

import com.example.aztustaj.entity.User;

public interface UserService {
    User register(User user);

    User findByUsername(String username);
}