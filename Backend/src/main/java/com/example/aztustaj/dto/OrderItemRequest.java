package com.example.aztustaj.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderItemRequest {
    @NotBlank
    private String bookId;

    @Min(1)
    private int quantity = 1;
}