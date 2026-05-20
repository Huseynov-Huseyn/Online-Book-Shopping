package com.example.aztustaj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
    private String bookId;
    private String bookTitle;
    private BigDecimal price;
    private Integer quantity;
}