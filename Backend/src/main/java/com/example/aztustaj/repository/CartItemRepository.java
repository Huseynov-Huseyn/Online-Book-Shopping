package com.example.aztustaj.repository;

import com.example.aztustaj.entity.Book;
import com.example.aztustaj.entity.Cart;
import com.example.aztustaj.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartAndBook(Cart cart, Book book);
}