package com.example.aztustaj.service;

import com.example.aztustaj.dto.ReviewRequest;
import com.example.aztustaj.dto.ReviewResponse;
import com.example.aztustaj.entity.Book;
import com.example.aztustaj.entity.Review;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.repository.BookRepository;
import com.example.aztustaj.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;

    @Override
    public ReviewResponse addReview(User user, ReviewRequest reviewRequest) {
        Book book = bookRepository.findById(reviewRequest.getBookId())
                .orElseThrow(() -> new RuntimeException("Kitab tapılmadı"));

        Review review = Review.builder()
                .user(user)
                .book(book)
                .rating(reviewRequest.getRating())
                .comment(reviewRequest.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);

        // Kitabın orta reytinqini yeniləyirik
        Double avgRating = getAverageRating(book.getId());
        book.setAverageRating(avgRating);
        bookRepository.save(book);

        return convertToResponse(savedReview);
    }

    @Override
    public List<ReviewResponse> getReviewsByBookId(String bookId) {
        return reviewRepository.findByBookId(bookId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Double getAverageRating(String bookId) {
        List<Review> reviews = reviewRepository.findByBookId(bookId);
        if (reviews.isEmpty()) {
            return 0.0;
        }
        return reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }

    private ReviewResponse convertToResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getUsername(),
                review.getRating(),
                review.getComment()
        );
    }
}
