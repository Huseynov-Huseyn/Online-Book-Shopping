package com.example.aztustaj.service;

import com.example.aztustaj.dto.OrderRequest;
import com.example.aztustaj.dto.OrderResponse;
import com.example.aztustaj.entity.Book;
import com.example.aztustaj.entity.Order;
import com.example.aztustaj.entity.OrderStatus;
import com.example.aztustaj.entity.User;
import com.example.aztustaj.repository.BookRepository;
import com.example.aztustaj.repository.OrderRepository;
import com.example.aztustaj.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Override
    public OrderResponse createOrder(OrderRequest orderRequest) {
        User user = userRepository.findById(orderRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("İstifadəçi tapılmadı"));

        List<Book> books = bookRepository.findAllById(orderRequest.getBookIds());
        if (books.isEmpty()) {
            throw new RuntimeException("Kitablar tapılmadı");
        }

        double totalPrice = books.stream().mapToDouble(Book::getPrice).sum();

        Order order = Order.builder()
                .user(user)
                .books(books)
                .totalPrice(totalPrice)
                .status(OrderStatus.PENDING)
                .build();

        Order savedOrder = orderRepository.save(order);
        return mapToResponse(savedOrder);
    }

    @Override
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));
        return mapToResponse(order);
    }

    @Override
    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OrderResponse updateOrderStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));

        try {
            order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
            Order updatedOrder = orderRepository.save(order);
            return mapToResponse(updatedOrder);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Yanlış status: " + status);
        }
    }

    @Override
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sifariş tapılmadı"));
        orderRepository.delete(order);
    }

    private OrderResponse mapToResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .bookIds(order.getBooks().stream().map(Book::getId).collect(Collectors.toList()))
                .totalPrice(order.getTotalPrice())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}