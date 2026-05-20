package com.example.aztustaj.controller;

import com.example.aztustaj.dto.ReviewRequest;
import com.example.aztustaj.dto.ReviewResponse;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> addReview(
            @RequestBody ReviewRequest reviewRequest,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(reviewService.addReview(user, reviewRequest));
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<ReviewResponse>> getBookReviews(@PathVariable String bookId) {
        return ResponseEntity.ok(reviewService.getReviewsByBookId(bookId));
    }

    @GetMapping("/book/{bookId}/average-rating")
    public ResponseEntity<Double> getAverageRating(@PathVariable String bookId) {
        return ResponseEntity.ok(reviewService.getAverageRating(bookId));
    }
}
