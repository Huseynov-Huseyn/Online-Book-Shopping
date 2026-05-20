package com.example.aztustaj.controller;

import com.example.aztustaj.dto.CartDTO;
import com.example.aztustaj.dto.CartItemDTO;
import com.example.aztustaj.entity.Cart;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping
    public ResponseEntity<CartDTO> getCart(Authentication auth) {
        User user = (User) auth.getPrincipal();
        Cart cart = cartService.getCart(user);
        return ResponseEntity.ok(convertToDTO(cart));
    }

    @PostMapping("/add/{bookId}")
    public ResponseEntity<CartDTO> addToCart(
            @PathVariable String bookId,
            @RequestParam(defaultValue = "1") Integer quantity,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        cartService.addToCart(user, bookId, quantity);
        Cart cart = cartService.getCart(user);
        return ResponseEntity.ok(convertToDTO(cart));
    }

    @DeleteMapping("/remove/{bookId}")
    public ResponseEntity<CartDTO> removeFromCart(
            @PathVariable String bookId,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        cartService.removeFromCart(user, bookId);
        Cart cart = cartService.getCart(user);
        return ResponseEntity.ok(convertToDTO(cart));
    }

    @PutMapping("/update/{bookId}")
    public ResponseEntity<CartDTO> updateQuantity(
            @PathVariable String bookId,
            @RequestParam Integer quantity,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        cartService.updateQuantity(user, bookId, quantity);
        Cart cart = cartService.getCart(user);
        return ResponseEntity.ok(convertToDTO(cart));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<String> clearCart(Authentication auth) {
        User user = (User) auth.getPrincipal();
        cartService.clearCart(user);
        return ResponseEntity.ok("Səbət boşaltıldı");
    }

    private CartDTO convertToDTO(Cart cart) {
        CartDTO dto = new CartDTO();
        dto.setCartId(cart.getId());
        dto.setTotalPrice(cart.getTotalPrice());
        dto.setItems(cart.getItems().stream()
                .map(item -> new CartItemDTO(
                        item.getBook().getId(),
                        item.getBook().getTitle(),
                        item.getBook().getPrice(),
                        item.getQuantity()
                ))
                .collect(Collectors.toList()));
        return dto;
    }
}