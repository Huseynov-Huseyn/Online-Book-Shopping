package com.example.aztustaj.service;

import com.example.aztustaj.dto.OrderItemRequest;
import com.example.aztustaj.dto.OrderItemResponse;
import com.example.aztustaj.dto.OrderRequest;
import com.example.aztustaj.dto.OrderResponse;
import com.example.aztustaj.entity.*;
import com.example.aztustaj.repository.BookRepository;
import com.example.aztustaj.repository.OrderRepository;
import com.example.aztustaj.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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

        if (orderRequest.getItems() == null || orderRequest.getItems().isEmpty()) {
            throw new RuntimeException("Sifariş üçün ən azı bir kitab seçilməlidir");
        }

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .totalPrice(BigDecimal.ZERO)
                .build();

        List<OrderItem> items = orderRequest.getItems()
                .stream()
                .map(itemRequest -> createOrderItem(order, itemRequest))
                .collect(Collectors.toList());

        BigDecimal totalPrice = items.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setItems(items);
        order.setTotalPrice(totalPrice);

        Order savedOrder = orderRepository.save(order);
        return mapToResponse(savedOrder);
    }

    private OrderItem createOrderItem(Order order, OrderItemRequest itemRequest) {
        Book book = bookRepository.findById(itemRequest.getBookId())
                .orElseThrow(() -> new RuntimeException("Kitab tapılmadı: " + itemRequest.getBookId()));

        int quantity = itemRequest.getQuantity() <= 0 ? 1 : itemRequest.getQuantity();
        BigDecimal unitPrice = book.getPrice();
        BigDecimal itemTotalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));

        return OrderItem.builder()
                .order(order)
                .book(book)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .totalPrice(itemTotalPrice)
                .build();
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
        List<OrderItemResponse> itemResponses = order.getItems() == null
                ? List.of()
                : order.getItems()
                  .stream()
                  .map(this::mapItemToResponse)
                  .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .items(itemResponses)
                .totalPrice(order.getTotalPrice())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderItemResponse mapItemToResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .bookId(item.getBook().getId())
                .title(item.getBook().getTitle())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build();
    }
}