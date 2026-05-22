package com.example.aztustaj.service;

import com.example.aztustaj.dto.AuthResponse;
import com.example.aztustaj.dto.LoginRequest;
import com.example.aztustaj.dto.RegisterRequest;
import com.example.aztustaj.entity.Role;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.repository.UserRepository;
import com.example.aztustaj.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Bu username artıq istifadə olunur");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.User)
                .build();

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser);

        return new AuthResponse(token, savedUser.getUsername(), savedUser.getRole().name(), savedUser.getId());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("İstifadəçi tapılmadı"));

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getUsername(), user.getRole().name(), user.getId());
    }
}