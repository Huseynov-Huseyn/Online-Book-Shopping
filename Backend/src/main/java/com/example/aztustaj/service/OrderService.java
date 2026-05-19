package com.example.aztustaj.service;

import com.example.aztustaj.dto.OrderRequest;
import com.example.aztustaj.dto.OrderResponse;

import java.util.List;

public interface OrderService {
    OrderResponse createOrder(OrderRequest orderRequest);

    OrderResponse getOrderById(Long id);

    List<OrderResponse> getUserOrders(Long userId);

    List<OrderResponse> getAllOrders();

    OrderResponse updateOrderStatus(Long id, String status);

    void deleteOrder(Long id);
}