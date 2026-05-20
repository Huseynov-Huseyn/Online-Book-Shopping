package com.example.aztustaj.config;

import com.example.aztustaj.entity.Role;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ROLE_ADMIN)
                    .build();

            userRepository.save(admin);
        }

        if (!userRepository.existsByUsername("satici")) {
            User seller = User.builder()
                    .username("satici")
                    .password(passwordEncoder.encode("satici123"))
                    .role(Role.ROLE_SATICI)
                    .build();

            userRepository.save(seller);
        }
    }
}