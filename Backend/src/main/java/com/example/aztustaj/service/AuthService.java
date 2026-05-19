package com.example.aztustaj.service;

import com.example.aztustaj.dto.AuthResponse;
import com.example.aztustaj.dto.LoginRequest;
import com.example.aztustaj.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}