package com.example.aztustaj.service;

import com.example.aztustaj.entity.Book;
import com.example.aztustaj.entity.Cart;
import com.example.aztustaj.entity.CartItem;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.repository.BookRepository;
import com.example.aztustaj.repository.CartItemRepository;
import com.example.aztustaj.repository.CartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private BookRepository bookRepository;

    // İstifadəçinin səbətini əldə et (yoxdursa yarat)
    public Cart getCart(User user) {
        Optional<Cart> cart = cartRepository.findByUser(user);
        if (cart.isEmpty()) {
            Cart newCart = new Cart();
            newCart.setUser(user);
            return cartRepository.save(newCart);
        }
        return cart.get();
    }

    // Səbətə kitab əlavə et
    public void addToCart(User user, String bookId, Integer quantity) {
        Cart cart = getCart(user);
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Kitab tapılmadı"));

        Optional<CartItem> existingItem = cartItemRepository.findByCartAndBook(cart, book);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setBook(book);
            newItem.setQuantity(quantity);
            cartItemRepository.save(newItem);
        }
    }

    // Səbətdən kitab sil
    public void removeFromCart(User user, String bookId) {
        Cart cart = getCart(user);
        Book book = bookRepository.findById(bookId).orElse(null);

        if (book != null) {
            Optional<CartItem> item = cartItemRepository.findByCartAndBook(cart, book);
            item.ifPresent(cartItemRepository::delete);
        }
    }

    // Miqdarı yenilə
    public void updateQuantity(User user, String bookId, Integer quantity) {
        Cart cart = getCart(user);
        Book book = bookRepository.findById(bookId).orElse(null);

        if (book != null && quantity > 0) {
            Optional<CartItem> item = cartItemRepository.findByCartAndBook(cart, book);
            if (item.isPresent()) {
                item.get().setQuantity(quantity);
                cartItemRepository.save(item.get());
            }
        }
    }

    // Səbəti boşalt
    public void clearCart(User user) {
        Cart cart = getCart(user);
        cart.getItems().clear();
        cartRepository.save(cart);
    }
}