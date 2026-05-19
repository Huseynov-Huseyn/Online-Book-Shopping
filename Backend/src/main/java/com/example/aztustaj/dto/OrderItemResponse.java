package com.example.aztustaj.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemResponse {
    private String bookId;
    private String title;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}