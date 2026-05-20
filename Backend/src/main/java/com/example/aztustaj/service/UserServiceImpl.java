package com.example.aztustaj.service;

import com.example.aztustaj.dto.UserProfileRequest;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public User updateProfile(String username, UserProfileRequest profileRequest) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        user.setFullName(profileRequest.getFullName());
        user.setEmail(profileRequest.getEmail());
        user.setPhoneNumber(profileRequest.getPhoneNumber());
        user.setAddress(profileRequest.getAddress());

        return userRepository.save(user);
    }
}