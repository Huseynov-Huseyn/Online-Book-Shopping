package com.example.aztustaj.service;

import com.example.aztustaj.dto.ReviewRequest;
import com.example.aztustaj.dto.ReviewResponse;
import com.example.aztustaj.entity.User;

import java.util.List;

public interface ReviewService {
    ReviewResponse addReview(User user, ReviewRequest reviewRequest);

    List<ReviewResponse> getReviewsByBookId(String bookId);

    Double getAverageRating(String bookId);
}
